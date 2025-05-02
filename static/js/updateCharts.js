let charts = {};
let currentZoomState = {};
let scrollPositions = {
    main: 0,
    sidebar: 0,
    chartsContainer: 0
};

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

// Function to create the search bar
function createSearchBar(sidebar) {
    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.id = 'search-container';
    searchContainer.style.position = 'relative';
    searchContainer.style.padding = '10px';
    searchContainer.style.marginBottom = '10px';
    searchContainer.style.borderBottom = '1px solid #ccc';
    searchContainer.style.backgroundColor = '#f8f9fa';
    
    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'chart-search';
    searchInput.placeholder = 'Search charts...';
    searchInput.style.width = '80%';
    searchInput.style.padding = '8px 30px 8px 10px';
    searchInput.style.border = '1px solid #ddd';
    searchInput.style.borderRadius = '4px';
    searchInput.style.fontSize = '14px';
    
    // Add clear button
    const clearButton = document.createElement('button');
    clearButton.id = 'clear-search';
    clearButton.innerHTML = '&times;';
    clearButton.style.position = 'absolute';
    clearButton.style.right = '15px';
    clearButton.style.top = '50%';
    clearButton.style.transform = 'translateY(-50%)';
    clearButton.style.background = 'none';
    clearButton.style.border = 'none';
    clearButton.style.color = '#999';
    clearButton.style.fontSize = '18px';
    clearButton.style.cursor = 'pointer';
    clearButton.style.padding = '0';
    clearButton.style.margin = '0';
    clearButton.style.height = '20px';
    clearButton.style.width = '20px';
    clearButton.style.lineHeight = '20px';
    clearButton.style.textAlign = 'center';
    clearButton.style.display = 'none'; // Initially hidden
    
    // Add event listeners
    searchInput.addEventListener('input', filterCharts);
    clearButton.addEventListener('click', clearSearch);
    
    // Add components to container
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(clearButton);
    
    // Add search container to sidebar after the timestamp
    const timestampDiv = document.getElementById('latest-timestamp-display');
    if (timestampDiv && timestampDiv.nextSibling) {
        sidebar.insertBefore(searchContainer, timestampDiv.nextSibling);
    } else if (timestampDiv) {
        sidebar.insertBefore(searchContainer, sidebar.firstChild.nextSibling);
    } else {
        sidebar.insertBefore(searchContainer, sidebar.firstChild);
    }
}

// Function to filter charts based on search
function filterCharts() {
    const searchInput = document.getElementById('chart-search');
    const clearButton = document.getElementById('clear-search');
    const searchTerm = searchInput.value.toLowerCase();
    const chartLinks = document.querySelectorAll('#sidebar a');
    
    // Show/hide clear button
    clearButton.style.display = searchTerm ? 'block' : 'none';
    
    // Filter the chart links
    let visibleCount = 0;
    chartLinks.forEach(link => {
        // Skip if it's part of search UI
        if (link.closest('#search-container')) return;
        
        const sheetName = link.querySelector('.sheet-name');
        if (!sheetName) return;
        
        const text = sheetName.textContent.toLowerCase();
        const match = text.includes(searchTerm);
        
        link.style.display = match ? 'flex' : 'none';
        if (match) visibleCount++;
    });
    
    // Optionally add a "no results" message
    let noResultsMsg = document.getElementById('no-search-results');
    if (searchTerm && visibleCount === 0) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.id = 'no-search-results';
            noResultsMsg.style.padding = '10px';
            noResultsMsg.style.textAlign = 'center';
            noResultsMsg.style.color = '#666';
            noResultsMsg.style.fontStyle = 'italic';
            noResultsMsg.textContent = 'No matching charts found';
            const searchContainer = document.getElementById('search-container');
            searchContainer.parentNode.insertBefore(noResultsMsg, searchContainer.nextSibling);
        }
        noResultsMsg.style.display = 'block';
    } else if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
}

// Function to clear the search
function clearSearch() {
    const searchInput = document.getElementById('chart-search');
    const clearButton = document.getElementById('clear-search');
    
    // Clear input and hide button
    searchInput.value = '';
    clearButton.style.display = 'none';
    
    // Show all chart links
    const chartLinks = document.querySelectorAll('#sidebar a');
    chartLinks.forEach(link => {
        if (!link.closest('#search-container')) {
            link.style.display = 'flex';
        }
    });
    
    // Hide the no results message if it exists
    const noResultsMsg = document.getElementById('no-search-results');
    if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
    
    // Focus back on search input
    searchInput.focus();
}

// Save all scroll positions before refreshing data
function saveAllScrollPositions() {
    // Main window scroll position
    scrollPositions.main = window.scrollY;
    
    // Sidebar scroll position
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        scrollPositions.sidebar = sidebar.scrollTop;
    }
    
    // Charts container scroll position
    const chartsContainer = document.getElementById('charts-container');
    if (chartsContainer) {
        scrollPositions.chartsContainer = chartsContainer.scrollTop;
    }
    
    // Save to localStorage as backup
    localStorage.setItem('scrollPositions', JSON.stringify(scrollPositions));
    
    console.log("Saved scroll positions:", scrollPositions);
}

// Restore all scroll positions after data refresh
function restoreAllScrollPositions() {
    // Try to get from localStorage if needed
    const savedPositions = localStorage.getItem('scrollPositions');
    if (savedPositions && (!scrollPositions.main && !scrollPositions.sidebar && !scrollPositions.chartsContainer)) {
        try {
            scrollPositions = JSON.parse(savedPositions);
        } catch (e) {
            console.error("Error parsing saved scroll positions:", e);
        }
    }
    
    console.log("Restoring scroll positions:", scrollPositions);
    
    // Restore main window scroll
    if (scrollPositions.main > 0) {
        window.scrollTo(0, scrollPositions.main);
    }
    
    // Restore sidebar scroll
    const sidebar = document.getElementById('sidebar');
    if (sidebar && scrollPositions.sidebar > 0) {
        sidebar.scrollTop = scrollPositions.sidebar;
    }
    
    // Restore charts container scroll
    const chartsContainer = document.getElementById('charts-container');
    if (chartsContainer && scrollPositions.chartsContainer > 0) {
        chartsContainer.scrollTop = scrollPositions.chartsContainer;
    }
}

async function fetchDataAndUpdateCharts() {
    // Save all scroll positions before updating
    saveAllScrollPositions();
    
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
    window.lastScrollPosition = scrollPositions.main;
    document.body.dataset.scrollPosition = scrollPositions.main;
    
    // Fetch timestamp
    await fetchRunLogTimestamp();

    // Fetch data
    const response = await fetch('/data');
    const data = await response.json();

    const sidebar = document.getElementById('sidebar');
    const container = document.getElementById('charts-container');

    // Remember search value if it exists
    let searchValue = '';
    const searchInput = document.getElementById('chart-search');
    if (searchInput) {
        searchValue = searchInput.value;
    }
    
    // Remember the timestamp element
    const timestampDiv = document.getElementById('latest-timestamp-display');
    
    // Clear content
    sidebar.innerHTML = '';
    container.innerHTML = '';
    
    // Restore timestamp at the top
    if (timestampDiv) {
        sidebar.appendChild(timestampDiv);
    }
    
    // Add search bar after timestamp
    createSearchBar(sidebar);
    
    // Restore search value if there was one and trigger filtering
    if (searchValue) {
        const newSearchInput = document.getElementById('chart-search');
        if (newSearchInput) {
            newSearchInput.value = searchValue;
            
            // Show the clear button if there's a search value
            const clearButton = document.getElementById('clear-search');
            if (clearButton) {
                clearButton.style.display = 'block';
            }
            
            // Ensure the DOM is ready before filtering
            setTimeout(() => {
                filterCharts();
                console.log("Re-applied search filter for:", searchValue);
            }, 50);
        }
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
        
        // Left side - sheet name with class
        const nameSpan = document.createElement('span');
        nameSpan.textContent = sheetName;
        nameSpan.className = 'sheet-name'; // Add this class
        
        // Right side - stats display
        const statsSpan = document.createElement('span');
        statsSpan.className = 'chart-stats';
        statsSpan.innerHTML = `
            <span class="latest-x"><b>T-</b> <span style="color: ${xValueColor}">${latestX}</span></span>
            <span class="latest-pl"><b>P/L:</b> <span style="color: ${plValueColor}">${formattedY1}</span></span>
            <span class="latest-rv"><b>RV:</b> <span style="color: ${rvValueColor}">${formattedY3}</span></span>
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
		
		// Log the raw data to see what's there
		console.log("N1P3 data for " + sheetName + ":", data[sheetName].n1p3);

		// Add row numbers to see what's being shown
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
                            modifierKey: null
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
    
    // Restore all scroll positions with multiple attempts
    restoreAllScrollPositions();
    
    // Try multiple approaches with increasing delays
    setTimeout(restoreAllScrollPositions, 100);
    setTimeout(restoreAllScrollPositions, 300);
    setTimeout(restoreAllScrollPositions, 500);
    setTimeout(restoreAllScrollPositions, 1000);
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
    
    /* Updated sidebar styles */
    #sidebar a {
        display: flex;
        justify-content: space-between;
        align-items: left;
        padding: 0px 0px;
        border-bottom: 1px solid #eee;
        transition: background-color 0.2s;
    }
    
    /* Added hover effect - this is the only change */
    #sidebar a:hover {
        background-color: #e0e0e0;
    }
    
    /* Sheet name styles */
    .sheet-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: calc(100% - 150px);
    }
    
    /* Chart stats in sidebar */
    .chart-stats {
        font-size: 12px;
        line-height: 1;
        white-space: nowrap;
        display: flex;
        justify-content: flex-start;
        width: 180px; /* Fixed width for the stats container */
        margin-left: 4px; /* This creates the minimum gap */
        flex-shrink: 0; /* Prevents the stats from shrinking */
    }
    
    .latest-x {
        width: 25px; /* Fixed width for T- column */
        text-align: left;
        margin-right: 8px;
    }
    
    .latest-pl {
        width: 65px; /* Fixed width for P/L column */
        text-align: left;
        margin-right: 12px;
    }
    
    .latest-rv {
        width: 65px; /* Fixed width for RV column */
        text-align: left;
		margin-left: 4px;
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
</style>
`);

// Auto-refresh every 5 minutes
let refreshTimer;

function setupAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    
    // Log when the next refresh attempt will be
    const nextRefreshTime = new Date(Date.now() + 300000); // 5 minutes from now
    console.log("Next refresh attempt will be at:", nextRefreshTime.toLocaleTimeString());
    
    // Check every 5 minutes if we should refresh the data
    refreshTimer = setInterval(() => {
        // Get current date in EST timezone
        const now = new Date();
        // Convert to EST by adding the offset (-5 hours from UTC during standard time, -4 during daylight saving)
        // Note: This is a simplified approach, a more robust solution would use a library like date-fns-tz
        const estOffset = -4; // -4 hours during daylight saving time (March to November)
        const utcHours = now.getUTCHours();
        const estHours = (utcHours + estOffset + 24) % 24;
        
        // Get day of week (0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday)
        const dayOfWeek = now.getUTCDay();
        
        // Check if current time is a weekday (Monday-Friday)
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        
        // Get minutes for checking if we're past 9:30 AM
        const estMinutes = now.getUTCMinutes();
        
        // Check if current time is between 9:30 AM and 4:00 PM EST
        const isMarketHours = isWeekday && 
                             ((estHours === 9 && estMinutes >= 30) || // 9:30 AM or later
                              (estHours > 9 && estHours < 16));       // 10 AM to 3:59 PM
        
        if (isMarketHours) {
            console.log("Auto-refreshing at:", new Date().toLocaleTimeString());
            fetchDataAndUpdateCharts();
        } else {
            console.log("Outside market hours, skipping refresh at:", new Date().toLocaleTimeString());
        }
        
        // Log when the next refresh attempt will be
        const nextRefreshTime = new Date(Date.now() + 300000); // 5 minutes from now
        console.log("Next refresh attempt will be at:", nextRefreshTime.toLocaleTimeString());
    }, 300000); // Check every 5 minutes
}

// Initial load
window.addEventListener('load', () => {
    fetchDataAndUpdateCharts();
    setupAutoRefresh();
    
    // Listen for scroll events to continuously track positions
    window.addEventListener('scroll', function() {
        scrollPositions.main = window.scrollY;
    });
    
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.addEventListener('scroll', function() {
            scrollPositions.sidebar = sidebar.scrollTop;
        });
    }
    
    const chartsContainer = document.getElementById('charts-container');
    if (chartsContainer) {
        chartsContainer.addEventListener('scroll', function() {
            scrollPositions.chartsContainer = chartsContainer.scrollTop;
        });
    }
});

// This is more reliable than relying on browser scroll restoration
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        // Try to restore from localStorage first
        const savedPositions = localStorage.getItem('scrollPositions');
        if (savedPositions) {
            try {
                scrollPositions = JSON.parse(savedPositions);
                restoreAllScrollPositions();
            } catch (e) {
                console.error("Error parsing saved scroll positions on pageshow:", e);
            }
        }
    }
});

// Reset auto-refresh when tab becomes visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        setupAutoRefresh();
        
        // Also try to restore scroll positions when tab becomes visible again
        restoreAllScrollPositions();
    }
});

// Save scroll positions before navigating away
window.addEventListener('beforeunload', () => {
    // Save current scroll positions to localStorage
    saveAllScrollPositions();
    
    // Clean up vertical line and tooltip
    const verticalLine = document.getElementById('chartjs-vertical-line');
    const tooltip = document.getElementById('chartjs-tooltip');
    
    if (verticalLine) verticalLine.remove();
    if (tooltip) tooltip.remove();
});