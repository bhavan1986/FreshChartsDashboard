let charts = {};
let currentZoomState = {};

// Function to fetch and display the RunLog timestamp
async function fetchRunLogTimestamp() {
    try {
        const response = await fetch('/get-runlog-timestamp');
        const data = await response.json();
        
        if (data && data.value) {
            // Create or update the timestamp element
            let timestampDiv = document.getElementById('latest-timestamp-display');
            
            if (!timestampDiv) {
                // Create if it doesn't exist
                timestampDiv = document.createElement('div');
                timestampDiv.id = 'latest-timestamp-display';
                timestampDiv.className = 'latest-timestamp';
                
                // Style it
                timestampDiv.style.padding = '10px';
                timestampDiv.style.marginBottom = '10px';
                timestampDiv.style.borderBottom = '1px solid #ccc';
                timestampDiv.style.fontWeight = 'bold';
                timestampDiv.style.textAlign = 'center';
                timestampDiv.style.backgroundColor = '#f8f9fa';
                
                // Add to the top of sidebar
                const sidebar = document.getElementById('sidebar');
                if (sidebar.firstChild) {
                    sidebar.insertBefore(timestampDiv, sidebar.firstChild);
                } else {
                    sidebar.appendChild(timestampDiv);
                }
            }
            
            // Update the content
            timestampDiv.innerHTML = `<strong>Latest Data:</strong> ${data.value}`;
        }
    } catch (error) {
        console.error('Error fetching RunLog timestamp:', error);
    }
}

async function fetchDataAndUpdateCharts() {
    // Record current scroll position - this is critical
    const scrollPosition = window.scrollY;
    console.log("Initial scroll position:", scrollPosition);
    
    // Save current zoom states for all charts
    for (let chartId in charts) {
        const chart = charts[chartId];
        if (!chart || !chart.scales || !chart.scales.x) continue;
        
        // Store exact min/max values
        currentZoomState[chartId] = {
            min: chart.scales.x.min,
            max: chart.scales.x.max,
            isViewingLatest: (chart.scales.x.max === undefined || 
                             chart.scales.x.max >= chart.data.labels.length - 1),
            dataLength: chart.data.labels.length,
            // Store how many points are being shown
            pointsVisible: chart.scales.x.max !== undefined && chart.scales.x.min !== undefined ? 
                          (chart.scales.x.max - chart.scales.x.min + 1) : chart.data.labels.length
        };
    }
    
    // Store scroll position in global variable that persists through refresh
    window.lastScrollPosition = scrollPosition;
    document.body.dataset.scrollPosition = scrollPosition;
    
    // Fetch timestamp
    await fetchRunLogTimestamp();

    // Fetch data
    const response = await fetch('/data');
    const data = await response.json();

    const sidebar = document.getElementById('sidebar');
    const container = document.getElementById('charts-container');

    // Remember the timestamp element
    const timestampDiv = document.getElementById('latest-timestamp-display');
    
    // Clear content
    sidebar.innerHTML = '';
    container.innerHTML = '';
    
    // Restore timestamp at the top
    if (timestampDiv) {
        sidebar.appendChild(timestampDiv);
    }

    for (let sheetName in data) {
        const chartId = 'chart_' + sheetName.replace(/\s+/g, '_');

        // Get the data for this chart
        const xLabels = data[sheetName].x;
        const y1 = data[sheetName].y1;
        const y2 = data[sheetName].y2;
        const y3 = data[sheetName].y3;

        // Find the last valid data point
        let lastIndex = xLabels.length - 1;
        // Go backwards until we find valid data for at least one of the series
        while (lastIndex >= 0 && 
               (y1[lastIndex] === null || y1[lastIndex] === undefined || isNaN(y1[lastIndex])) &&
               (y3[lastIndex] === null || y3[lastIndex] === undefined || isNaN(y3[lastIndex]))) {
            lastIndex--;
        }

        // Get latest values if we have valid data
        let latestX = '';
        let formattedY1 = 'N/A';
        let formattedY3 = 'N/A';
        let plValue = null;
        let rvValue = null;

        if (lastIndex >= 0) {
            latestX = xLabels[lastIndex];
            
            if (y1[lastIndex] !== null && y1[lastIndex] !== undefined && !isNaN(y1[lastIndex])) {
                plValue = y1[lastIndex];
                formattedY1 = (plValue * 100).toFixed(2) + '%';
            }
            
            if (y3[lastIndex] !== null && y3[lastIndex] !== undefined && !isNaN(y3[lastIndex])) {
                rvValue = y3[lastIndex];
                formattedY3 = (rvValue * 100).toFixed(2) + '%';
            }
        }

        // Determine colors for the values only (not the labels)
        const plValueColor = plValue !== null ? (plValue >= 0 ? 'green' : 'red') : 'blue';
        const rvValueColor = rvValue !== null ? (rvValue >= 0 ? 'green' : 'red') : 'red';
		
		// Determine color for the T- value based on the number
        let xValueColor = 'yellow'; // Default color
        if (latestX !== '') {
            // Try to convert to a number
            const xNum = parseInt(latestX);
            if (!isNaN(xNum)) {
                if (xNum > 6) {
                    xValueColor = 'green';
                } else if (xNum >= 4) {
                    xValueColor = 'darkorange'; // More readable than yellow on gray background
                } else {
                    xValueColor = 'red';
                }
            }
        }

        // Create sidebar item with data on the right side
        const link = document.createElement('a');
        link.href = '#' + chartId;
        link.style.display = 'flex';
        link.style.justifyContent = 'space-between';
        link.style.alignItems = 'center';
        
        // Left side - just the sheet name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = sheetName;
        
        // Right side - stats display
        const statsSpan = document.createElement('span');
        statsSpan.className = 'chart-stats';
        statsSpan.innerHTML = `
            <span class="latest-x">T - <span style="color: ${xValueColor}">${latestX}</span></span> | 
            <span class="latest-pl">P/L: <b style="color: ${plValueColor}">${formattedY1}</b></span> | 
            <span class="latest-rv">RV: <b style="color: ${rvValueColor}">${formattedY3}</b></span>
        `;
        
        // Add both spans to the link
        link.appendChild(nameSpan);
        link.appendChild(statsSpan);
        
        sidebar.appendChild(link);

        // Chart container
        const chartDiv = document.createElement('div');
        chartDiv.className = 'chart-container';
        chartDiv.id = chartId;

        // Sheet Title
        const sheetTitle = document.createElement('div');
        sheetTitle.className = 'sheet-title';
        sheetTitle.innerHTML = `<b>${sheetName}</b>`;
        chartDiv.appendChild(sheetTitle);

        // N1:P3 Box
        const n1p3Div = document.createElement('div');
        n1p3Div.className = 'n1p3-box';
        n1p3Div.innerHTML = data[sheetName].n1p3.map(row => row.join(' | ')).join('<br>');
        chartDiv.appendChild(n1p3Div);

        // Canvas
        const canvas = document.createElement('canvas');
        chartDiv.appendChild(canvas);

        // Double-click to reset zoom
        canvas.addEventListener('dblclick', function() {
            if (charts[chartId]) {
                // Full reset - set both min and max to undefined
                charts[chartId].options.scales.x.min = undefined;
                charts[chartId].options.scales.x.max = undefined;
                charts[chartId].update();
            }
        });

        // Reset Zoom button
        const resetBtn = document.createElement('button');
        resetBtn.className = 'reset-zoom-btn';
        resetBtn.innerText = 'Reset Zoom';
        resetBtn.onclick = function() {
            if (charts[chartId]) {
                // Full reset - set both min and max to undefined
                charts[chartId].options.scales.x.min = undefined;
                charts[chartId].options.scales.x.max = undefined;
                charts[chartId].update();
            }
        };
        chartDiv.appendChild(resetBtn);

        container.appendChild(chartDiv);

        // Chart creation
        const ctx = canvas.getContext('2d');
        const allYValues = y1.concat(y2).concat(y3);
        const validYValues = allYValues.filter(val => val !== null && val !== undefined && !isNaN(val));
        const minY = Math.min(...validYValues);
        const maxY = Math.max(...validYValues);
        const padding = (maxY - minY) * 0.05;
        const paddedMinY = minY - padding;
        const paddedMaxY = maxY + padding;

        charts[chartId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: xLabels,
                datasets: [
                    {
                        label: 'P/L %',
                        data: y1,
                        borderColor: 'blue',
                        backgroundColor: 'blue',
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Stock Move from Open %',
                        data: y2,
                        borderColor: '#ffb300',
                        backgroundColor: '#ffb300',
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Daily RV Drop %',
                        data: y3,
                        borderColor: 'red',
                        backgroundColor: 'red',
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        yAxisID: 'y2'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                // This is critical for mobile touch handling
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'touchend'],
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'T MINUS ',
                            font:{
                                size: 14,
                                weight: 'bold'
                            },
                            color: 'black'
                        },
                        ticks: {
                            callback: function(value) {
                                return this.getLabelForValue(value);
                            },
                            autoSkip: false,
                            // Add color function for x-axis labels
                            color: function(context) {
                                const tickValue = context.tick.value;
                                const tickLabel = context.chart.data.labels[tickValue];
                                
                                // Get all labels
                                const allLabels = context.chart.data.labels;
                                
                                // Check if this label starts a new value group
                                const isNewValueGroup = (index) => {
                                    if (index === 0) return true;
                                    return allLabels[index] !== allLabels[index-1];
                                };
                                
                                // Count value group changes up to this index
                                let groupChangeCount = 0;
                                for (let i = 0; i <= tickValue; i++) {
                                    if (isNewValueGroup(i)) {
                                        groupChangeCount++;
                                    }
                                }
                                
                                // Alternate colors based on group number
                                return groupChangeCount % 2 === 0 ? 
                                    'rgb(75, 192, 75)' :  // Green for even groups
                                    'rgb(255, 99, 132)';  // Red for odd groups
                            },
                            font: {
                                weight: 'bold' // Make labels bold for better visibility
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        min: paddedMinY,
                        max: paddedMaxY,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'P/L %   |    Stock Move %',
                            font:{
                                size: 14,
                                weight: 'bold'
                            },
                            color: 'black'
                        },
                        ticks: {
                            callback: function(value) {
                                return (value * 100).toFixed(2) + '%';
                            }
                        },
                        grid: {
                            color: function(context) {
                                if (context.tick.value === 0) {
                                    return 'black';
                                }
                                return 'rgba(0,0,0,0.1)';
                            },
                            lineWidth: function(context) {
                                if (context.tick.value === 0) {
                                    return 2;
                                }
                                return 1;
                            }
                        }
                    },
                    y2: {
                        type: 'linear',
                        min: paddedMinY,
                        max: paddedMaxY,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        },
                        title: {
                            display: true,
                            text: 'Daily RV Drop %',
                            font:{
                                size: 14,
                                weight: 'bold'
                            },
                            color: 'black'
                        },
                        ticks: {
                            callback: function(value) {
                                return (value * 100).toFixed(2) + '%';
                            }
                        }
                    }
                },
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            overScaleMode: 'x',
                            threshold: 5,  // Lower threshold for easier activation on mobile
                            speed: 20,     // Faster panning
                            modifierKey: null,  // Allow panning without modifier keys on mobile
                            sensitivity: 5,   // Higher sensitivity for mobile
                            wheel: {
                                enabled: true,
                            },
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                                modifierKey: 'ctrl',
                            },
                            pinch: {
                                enabled: true,
                                threshold: 0.1, // Increase sensitivity for mobile
                            },
                            drag: {
                                enabled: true,
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                borderColor: 'rgba(0,0,0,0.5)',
                                borderWidth: 1,
                            },
                            mode: 'x'
                        }
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        axis: 'x',
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += (context.parsed.y * 100).toFixed(2) + '%';
                                }
                                return label;
                            },
                            footer: function(tooltipItems) {
                                // Get the chart and index
                                const chart = tooltipItems[0].chart;
                                const index = tooltipItems[0].dataIndex;
                                
                                // Check if timestamps exist and display if available
                                if (chart.timestamps && 
                                    chart.timestamps[index] && 
                                    chart.timestamps[index] !== "" && 
                                    chart.timestamps[index] !== null && 
                                    chart.timestamps[index] !== undefined) {
                                    
                                    // Parse the timestamp - handle different formats
                                    const timestamp = chart.timestamps[index];
                                    let date;
                                    
                                    if (timestamp.includes('/')) {
                                        // If format is MM/DD/YYYY HH:MM
                                        const [datePart, timePart] = timestamp.split(' ');
                                        const [month, day, year] = datePart.split('/');
                                        const [hour, minute] = timePart ? timePart.split(':') : [0, 0];
                                        
                                        // Create date, assuming it's in PST
                                        date = new Date(year, month - 1, day, hour, minute);
                                    } else {
                                        // Try to parse as ISO string or other format
                                        date = new Date(timestamp);
                                    }
                                    
                                    // Check if date is valid
                                    if (!isNaN(date.getTime())) {
                                        // Add 4 hours to convert from PST to EST (GMT-8 to GMT-4)
                                        const estDate = new Date(date.getTime() + (4 * 60 * 60 * 1000));
                                        
                                        // Format with day of week
                                        const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
                                        const dayOfWeek = days[estDate.getDay()];
                                        
                                        // Format date
                                        const month = estDate.getMonth() + 1; // getMonth is 0-indexed
                                        const day = estDate.getDate();
                                        const year = estDate.getFullYear();
                                        
                                        // Format time
                                        let hours = estDate.getHours();
                                        const minutes = estDate.getMinutes().toString().padStart(2, '0');
                                        const ampm = hours >= 12 ? 'PM' : 'AM';
                                        hours = hours % 12;
                                        hours = hours ? hours : 12; // Convert 0 to 12 for 12-hour format
                                        
                                        // Complete EST timestamp with day of week
                                        const estTimestamp = `${dayOfWeek}, ${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
                                        return 'Time(EST): ' + estTimestamp;
                                    } else {
                                        // If we can't parse the date, just return the original
                                        return 'Timestamp: ' + timestamp;
                                    }
                                }
                                return ''; // Omit timestamp when not available
                            }
                        },
                        external: function(context) {
                            // Get tooltip element
                            const tooltipEl = document.getElementById('chartjs-tooltip');
                            
                            // Hide if no tooltip
                            const tooltipModel = context.tooltip;
                            if (tooltipModel.opacity === 0) {
                                if (tooltipEl) {
                                    tooltipEl.style.opacity = 0;
                                }
                                
                                // Remove vertical line if exists
                                const verticalLine = document.getElementById('chartjs-vertical-line');
                                if (verticalLine) {
                                    verticalLine.style.opacity = 0;
                                }
                                
                                return;
                            }

                            // Set caret Position
                            tooltipEl.classList.remove('above', 'below', 'no-transform');
                            if (tooltipModel.yAlign) {
                                tooltipEl.classList.add(tooltipModel.yAlign);
                            } else {
                                tooltipEl.classList.add('no-transform');
                            }

                            // Create or update vertical line
                            let verticalLine = document.getElementById('chartjs-vertical-line');
                            const chart = context.chart;
                            const xPosition = tooltipModel.caretX;
                            
                            if (!verticalLine) {
                                verticalLine = document.createElement('div');
                                verticalLine.id = 'chartjs-vertical-line';
                                verticalLine.style.position = 'absolute';
                                verticalLine.style.pointerEvents = 'none';
                                document.body.appendChild(verticalLine);
                            }
                            
                            // Position the vertical line
                            const chartPosition = chart.canvas.getBoundingClientRect();
                            verticalLine.style.opacity = 1;
                            verticalLine.style.borderLeft = '2px dashed rgba(0, 0, 0, 0.7)';
                            verticalLine.style.left = (chartPosition.left + xPosition) + 'px';
                            verticalLine.style.top = chartPosition.top + 'px';
                            verticalLine.style.height = chartPosition.height + 'px';
                            verticalLine.style.zIndex = 999;
                        }
                    }
                },
                onHover: function(e) {
                    if (!e.native) return;
                    
                    // Add cursor style on hover
                    const points = charts[chartId].getElementsAtEventForMode(e, 'nearest', { intersect: false }, true);
                    if (points.length) {
                        e.native.target.style.cursor = 'pointer';
                    } else {
                        e.native.target.style.cursor = 'default';
                    }
                }
            }
        });
        
        // Store y4 data (timestamp) with the chart if it exists
        if (data[sheetName].y4) {
            charts[chartId].timestamps = data[sheetName].y4;
        }
        
        // Create tooltip div if it doesn't exist
        if (!document.getElementById('chartjs-tooltip')) {
            const tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip';
            tooltipEl.style.opacity = 0;
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.position = 'absolute';
            tooltipEl.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            tooltipEl.style.borderRadius = '3px';
            tooltipEl.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.25)';
            tooltipEl.style.padding = '10px';
            tooltipEl.style.zIndex = 1000;
            document.body.appendChild(tooltipEl);
        }
    } // End of for-loop

    // Apply saved zoom states for each chart
    for (let chartId in charts) {
        const chart = charts[chartId];
        const savedState = currentZoomState[chartId];
        
        if (!chart || !savedState) continue;
        
        const newDataLength = chart.data.labels.length;
        
        try {
            if (savedState.isViewingLatest) {
                // If viewing the latest data, adjust the view to show the same number of points
                // but shifted to include any new data points
                const pointsToShow = savedState.pointsVisible;
                const newMin = Math.max(0, newDataLength - pointsToShow);
                
                chart.options.scales.x.min = newMin;
                chart.options.scales.x.max = newDataLength - 1;
            } else {
                // Otherwise, maintain the exact same view
                chart.options.scales.x.min = savedState.min;
                chart.options.scales.x.max = savedState.max;
            }
            
            // Update the chart
            chart.update();
            
        } catch (error) {
            console.error("Error restoring zoom state:", error);
        }
    }
    
    // More aggressive scroll restoration
    const restoreScrollPosition = () => {
        const scrollTarget = window.lastScrollPosition || scrollPosition || 
                           parseInt(document.body.dataset.scrollPosition) || 0;
                           
        if (scrollTarget > 0) {
            console.log("Restoring scroll to position:", scrollTarget);
            window.scrollTo(0, scrollTarget);
            document.documentElement.scrollTop = scrollTarget;
            document.body.scrollTop = scrollTarget;
        }
    };
    
    // Try multiple approaches with increasing delays
    setTimeout(restoreScrollPosition, 0);
    setTimeout(restoreScrollPosition, 100);
    setTimeout(restoreScrollPosition, 300);
    setTimeout(restoreScrollPosition, 500);
    setTimeout(restoreScrollPosition, 1000);
    
    // Add a scroll marker that won't be removed during chart reloading
    if (!document.getElementById('scroll-marker')) {
        const marker = document.createElement('div');
        marker.id = 'scroll-marker';
        marker.style.position = 'absolute';
        marker.style.top = scrollPosition + 'px';
        marker.style.left = '0';
        marker.style.width = '1px';
        marker.style.height = '1px';
        marker.style.pointerEvents = 'none';
        marker.style.opacity = '0';
        document.body.appendChild(marker);
    } else {
        // Update existing marker position
        const marker = document.getElementById('scroll-marker');
        marker.style.top = scrollPosition + 'px';
    }
    
    // Enhanced touch support for all canvases
    enhanceTouchSupport();
    
    // Initialize Hammer.js directly on canvases
    initializeHammerOnCanvases();
}

// Function to improve touch support for all canvas elements
function enhanceTouchSupport() {
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        // Make sure canvas has proper dimensions and is visible to touch events
        canvas.style.touchAction = 'none';
        canvas.style.msTounchAction = 'none';
        canvas.style.webkitUserSelect = 'none';
        canvas.style.userSelect = 'none';
        
        // Direct touch event listeners
        canvas.addEventListener('touchstart', function(e) {
            e.preventDefault();
            console.log('Touch start detected on canvas');
        }, { passive: false });
        
        canvas.addEventListener('touchmove', function(e) {
            e.preventDefault();
            console.log('Touch move detected on canvas');
        }, { passive: false });
        
        // Add a touch wrapper to ensure the element receives touch events
        const parent = canvas.parentElement;
        if (parent) {
            parent.style.touchAction = 'none';
            parent.style.msTounchAction = 'none';
            parent.style.webkitUserSelect = 'none';
            parent.style.userSelect = 'none';
            
            parent.addEventListener('touchstart', function(e) {
                e.preventDefault();
                console.log('Touch start detected on parent');
            }, { passive: false });
            
            parent.addEventListener('touchmove', function(e) {
                e.preventDefault();
                console.log('Touch move detected on parent');
            }, { passive: false });
        }
    });
}

// Function to initialize Hammer.js directly on the canvases
function initializeHammerOnCanvases() {
    if (typeof Hammer === 'undefined') {
        console.error('Hammer.js is not loaded. Cannot initialize touch gestures.');
        return;
    }
    
    const canvases = document.querySelectorAll('canvas');
    
    canvases.forEach(canvas => {
        // Create a new Hammer instance directly on the canvas
        const hammerInstance = new Hammer(canvas);
        
        // Configure for horizontal panning
        hammerInstance.get('pan').set({
            direction: Hammer.DIRECTION_HORIZONTAL,
            threshold: 5
        });
        
        // Log events to debug
        hammerInstance.on('panstart', function(e) {
            console.log('Hammer pan start', e);
        });
        
        hammerInstance.on('panmove', function(e) {
            console.log('Hammer pan move', e);
            // Find the corresponding Chart.js instance for this canvas
            let chartId = null;
            for (let id in charts) {
                if (charts[id].canvas === canvas) {
                    chartId = id;
                    break;
                }
            }
            
            if (chartId && charts[chartId]) {
                // Manually trigger pan in Chart.js based on Hammer movement
                const chart = charts[chartId];
                const deltaX = e.deltaX;
                
                // Get current view window
                const min = chart.scales.x.min || 0;
                const max = chart.scales.x.max || chart.data.labels.length - 1;
                const range = max - min;
                
                // Calculate new position - move in opposite direction of pan
                const pixelRatio = chart.currentDevicePixelRatio;
                const canvasWidth = chart.width / pixelRatio;
                const pixelsPerDataPoint = canvasWidth / range;
                
                // Calculate how many data points to move
                const moveAmount = deltaX / pixelsPerDataPoint;
                
                // Set new min/max
                chart.options.scales.x.min = min - moveAmount;
                chart.options.scales.x.max = max - moveAmount;
                
                // Update chart
                chart.update('none'); // No animation for smoother panning
            }
        });
        
        hammerInstance.on('panend', function(e) {
            console.log('Hammer pan end', e);
        });
    });
}

// Add CSS for vertical line, tooltip, and sidebar chart stats
document.head.insertAdjacentHTML('beforeend', `
<style>
    #chartjs-vertical-line {
        pointer-events: none;
        transition: opacity 0.2s ease;
    }
    #chartjs-tooltip {
        transition: opacity 0.2s ease;
    }
    /* Chart stats in sidebar */
    .chart-stats {
        font-size: 12px;
        line-height: 1.2;
        text-align: right;
        white-space: nowrap;
    }
    .latest-x {
        font-weight: bold;
        color: blue;
    }
    .latest-pl {
        color: blue;
    }
    .latest-rv {
        color: blue;
    }
    /* Timestamp display at top of sidebar */
    .latest-timestamp {
        padding: 10px;
        margin-bottom: 10px;
        border-bottom: 1px solid #ccc;
        font-weight: bold;
        text-align: center;
        background-color: #f8f9fa;
    }
    /* Add touch-specific CSS for better mobile experience */
    canvas {
        touch-action: none !important;
        -ms-touch-action: none !important;
        -webkit-user-select: none !important;
        user-select: none !important;
    }
    
    .chart-container {
        touch-action: none !important;
        -ms-touch-action: none !important;
        overflow: visible !important;
        -webkit-tap-highlight-touch-action: none !important;
        -ms-touch-action: none !important;
        overflow: visible !important;
        -webkit-tap-highlight-color: transparent;
    }
</style>
`);

// Auto-refresh every 5 minutes
let refreshTimer;

function setupAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    
    refreshTimer = setInterval(() => {
        console.log("Auto-refreshing at:", new Date().toLocaleTimeString());
        fetchDataAndUpdateCharts();
    }, 300000); // 5 minutes
}

// Initial load
window.addEventListener('load', () => {
    fetchDataAndUpdateCharts();
    setupAutoRefresh();
    
    // Try to restore scroll position from previous page load
    if (window.lastScrollPosition > 0) {
        window.scrollTo(0, window.lastScrollPosition);
    }
});

// This is more reliable than relying on browser scroll restoration
window.addEventListener('pageshow', (event) => {
    if (event.persisted || window.lastScrollPosition > 0) {
        window.scrollTo(0, window.lastScrollPosition || 0);
    }
});

// Reset auto-refresh when tab becomes visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        setupAutoRefresh();
        
        // Also try to restore scroll position when tab becomes visible again
        if (window.lastScrollPosition > 0) {
            window.scrollTo(0, window.lastScrollPosition);
        } else if (document.getElementById('scroll-marker')) {
            // Try to get position from marker
            const marker = document.getElementById('scroll-marker');
            const position = parseInt(marker.style.top);
            if (!isNaN(position) && position > 0) {
                window.scrollTo(0, position);
            }
        }
    }
});

// Clean up vertical line and tooltip when navigating away
window.addEventListener('beforeunload', () => {
    const verticalLine = document.getElementById('chartjs-vertical-line');
    const tooltip = document.getElementById('chartjs-tooltip');
    
    if (verticalLine) verticalLine.remove();
    if (tooltip) tooltip.remove();
});