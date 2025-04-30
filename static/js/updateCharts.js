let charts = {};
let currentZoomState = {};

async function fetchDataAndUpdateCharts() {
    const scrollPos = window.scrollY; // Save scroll position early

    const response = await fetch('/data');
    const data = await response.json();

    const sidebar = document.getElementById('sidebar');
    const container = document.getElementById('charts-container');

    sidebar.innerHTML = '';
    container.innerHTML = '';

    for (let sheetName in data) {
        const chartId = 'chart_' + sheetName.replace(/\s+/g, '_');

        // Sidebar link
        const link = document.createElement('a');
        link.href = '#' + chartId;
        link.textContent = sheetName;
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
                charts[chartId].resetZoom();
            }
        });

        // Reset Zoom button
        const resetBtn = document.createElement('button');
        resetBtn.className = 'reset-zoom-btn';
        resetBtn.innerText = 'Reset Zoom';
        resetBtn.onclick = function() {
            if (charts[chartId]) charts[chartId].resetZoom();
        };
        chartDiv.appendChild(resetBtn);

        container.appendChild(chartDiv);

        // Chart creation
        const ctx = canvas.getContext('2d');
        const xLabels = data[sheetName].x;
        const y1 = data[sheetName].y1;
        const y2 = data[sheetName].y2;
        const y3 = data[sheetName].y3;

        const allYValues = y1.concat(y2).concat(y3);
        const minY = Math.min(...allYValues);
        const maxY = Math.max(...allYValues);
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
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'T - '
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
                            text: 'P/L % | Stock Move %'
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
                            text: 'Daily RV Drop %'
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
                            // Add footer callback to display timestamp when available
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
                        // Add the vertical line on hover
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

    // AFTER all charts created, restore zooms
    restoreAllZoomStates();

    // THEN restore scroll
    window.scrollTo(0, scrollPos);
}

/**
 * Updates the color of x-axis labels on an existing chart.
 * Call this after a chart update if you need to reapply coloring.
 * 
 * @param {string} chartId - The ID of the chart to update
 */
function updateXAxisColors(chartId) {
    const chart = charts[chartId];
    if (!chart) return;
    
    // Get the original options
    const originalOptions = chart.options.scales.x || {};
    
    // Update the color function
    chart.options.scales.x = {
        ...originalOptions,
        ticks: {
            ...originalOptions.ticks,
            color: function(context) {
                const tickValue = context.tick.value;
                const allLabels = chart.data.labels;
                
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
                ...originalOptions.ticks?.font,
                weight: 'bold' // Make labels bold for better visibility
            }
        }
    };
    
    // Update the chart to apply changes
    chart.update();
}

// Save zoom states before refresh
function saveAllZoomStates() {
    for (let chartId in charts) {
        const chart = charts[chartId];
        currentZoomState[chartId] = {
            min: chart.scales.x.min,
            max: chart.scales.x.max
        };
    }
    currentZoomState['scrollPos'] = window.scrollY;
}

// Restore zoom states after refresh
function restoreAllZoomStates() {
    for (let chartId in charts) {
        const chart = charts[chartId];
        if (currentZoomState[chartId]) {
            chart.options.scales.x.min = currentZoomState[chartId].min;
            chart.options.scales.x.max = currentZoomState[chartId].max;
            chart.update();
            // Reapply x-axis coloring after restoring zoom state
            updateXAxisColors(chartId);
        }
    }
}

// Add CSS for vertical line and tooltip
document.head.insertAdjacentHTML('beforeend', `
<style>
    #chartjs-vertical-line {
        pointer-events: none;
        transition: opacity 0.2s ease;
    }
    #chartjs-tooltip {
        transition: opacity 0.2s ease;
    }
</style>
`);

// Initial load
fetchDataAndUpdateCharts();

// Auto-refresh every 5 minutes
setInterval(async () => {
    saveAllZoomStates();
    await fetchDataAndUpdateCharts();
}, 300000);

// Clean up vertical line and tooltip when navigating away
window.addEventListener('beforeunload', () => {
    const verticalLine = document.getElementById('chartjs-vertical-line');
    const tooltip = document.getElementById('chartjs-tooltip');
    
    if (verticalLine) verticalLine.remove();
    if (tooltip) tooltip.remove();
});