let charts = {};
let currentZoomState = {};
let scrollPositions = {
    main: 0,
    sidebar: 0,
    chartsContainer: 0
};

// Register custom plugin for point highlighting
// This plugin will handle highlighting points without causing recursive updates
Chart.register({
    id: 'highlightDataPoint',
    beforeDraw: function(chart) {
        if (!chart.tooltip || !chart.tooltip._active || chart.tooltip._active.length === 0) return;
        
        const ctx = chart.ctx;
        const activeElements = chart.tooltip._active;
        const activePoint = activeElements[0];
        const dataIndex = activePoint.index;
        
        // Draw highlighted points at this index for all datasets
        chart.data.datasets.forEach((dataset, i) => {
            // Skip if data doesn't exist at this index or is null/undefined
            if (!dataset.data[dataIndex] || 
                dataset.data[dataIndex] === null || 
                dataset.data[dataIndex] === undefined || 
                isNaN(dataset.data[dataIndex])) {
                return;
            }
            
            // Get the meta for this dataset
            const meta = chart.getDatasetMeta(i);
            if (!meta || !meta.data || !meta.data[dataIndex]) return;
            
            // Get the point element
            const point = meta.data[dataIndex];
            
            // Get position
            const x = point.x;
            const y = point.y;
            
            // Save the current drawing state
            ctx.save();
            
            // Draw outer highlight circle
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = dataset.backgroundColor || 'blue';
            ctx.fill();
            
            // Draw white border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Restore the drawing state
            ctx.restore();
        });
    }
});

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
                timestampDiv.style.fontWeight = 'bold';
                timestampDiv.style.textAlign = 'center';
                timestampDiv.style.backgroundColor = '#f8f9fa';
            }
            
            // Update the content
            timestampDiv.innerHTML = `<strong>Latest Data:</strong> ${data.value}`;
            
            // Make sure it's in the DOM in the correct place
            const fixedContainer = document.getElementById('fixed-sidebar-elements');
            if (fixedContainer) {
                // Check if timestamp is already a child of fixed container
                if (!fixedContainer.contains(timestampDiv)) {
                    // Insert at the top of fixed container
                    fixedContainer.insertBefore(timestampDiv, fixedContainer.firstChild);
                }
            } else {
                // If no fixed container, add directly to sidebar
                const sidebar = document.getElementById('sidebar');
                if (!sidebar.contains(timestampDiv)) {
                    if (sidebar.firstChild) {
                        sidebar.insertBefore(timestampDiv, sidebar.firstChild);
                    } else {
                        sidebar.appendChild(timestampDiv);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error fetching RunLog timestamp:', error);
    }
}

// Function to create the search bar
function createSearchBar(sidebar) {
    // Create a container for fixed elements if it doesn't exist
    let fixedContainer = document.getElementById('fixed-sidebar-elements');
    if (!fixedContainer) {
        fixedContainer = document.createElement('div');
        fixedContainer.id = 'fixed-sidebar-elements';
        fixedContainer.style.position = 'sticky';
        fixedContainer.style.top = '0';
        fixedContainer.style.zIndex = '20';
        fixedContainer.style.backgroundColor = '#f2f2f2';
        fixedContainer.style.width = '100%';
        fixedContainer.style.borderBottom = '1px solid #ddd';
        fixedContainer.style.margin = '0';
        fixedContainer.style.padding = '0';
        
        // Add the timestamp to this container if it exists
        const timestampDiv = document.getElementById('latest-timestamp-display');
        if (timestampDiv) {
            // Move the timestamp if it's already in the DOM
            if (timestampDiv.parentNode) {
                timestampDiv.parentNode.removeChild(timestampDiv);
            }
            fixedContainer.appendChild(timestampDiv);
        }
        
        // Insert the fixed container at the top of the sidebar
        if (sidebar.firstChild) {
            sidebar.insertBefore(fixedContainer, sidebar.firstChild);
        } else {
            sidebar.appendChild(fixedContainer);
        }
    }
    
    // Check if search container already exists in the fixed container
    let searchContainer = document.getElementById('search-container');
    if (searchContainer) {
        // If it exists, don't create a new one
        return;
    }
    
    // Create search container
    searchContainer = document.createElement('div');
    searchContainer.id = 'search-container';
    searchContainer.style.position = 'relative';
    searchContainer.style.padding = '10px';
    searchContainer.style.marginBottom = '10px';
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
    
    // Add search container to the fixed container
    fixedContainer.appendChild(searchContainer);
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
    
    // Remember search value if it exists
    let searchValue = '';
    const searchInput = document.getElementById('chart-search');
    if (searchInput) {
        searchValue = searchInput.value;
    }
    
    // Create or ensure the fixed container exists before clearing anything
    const sidebar = document.getElementById('sidebar');
    let fixedContainer = document.getElementById('fixed-sidebar-elements');
    
    if (!fixedContainer) {
        // If no fixed container yet, create it
        createSearchBar(sidebar); // This will create the fixed container
        fixedContainer = document.getElementById('fixed-sidebar-elements');
    }
    
    // Don't clear the charts container or sidebar yet - fetch data first
    // to avoid the blank screen during refresh
    
    // Fetch timestamp in background (this creates or updates the timestamp in the fixed container)
    const timestampPromise = fetchRunLogTimestamp();
    
    // Fetch data in parallel
    const dataPromise = fetch('/data').then(response => response.json());
    
    // Wait for both operations to complete
    const [data] = await Promise.all([dataPromise, timestampPromise]);
    
    // Now that we have the data, we can update the UI
    
    // Remember existing chart references before clearing
    const existingCharts = {...charts};
    
    // NOW clear the charts container
    const container = document.getElementById('charts-container');
    container.innerHTML = '';
    
    // Now clear only the non-fixed elements in the sidebar
    if (fixedContainer) {
        // Remove all children except the fixed container
        Array.from(sidebar.children).forEach(child => {
            if (child !== fixedContainer) {
                sidebar.removeChild(child);
            }
        });
    }
    
    // Create search bar if needed (this checks if it already exists)
    createSearchBar(sidebar);
    
    // Restore search value if there was one
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
    
    // Create chart divs
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
        link.style.padding = '4px 4px'; // Added left/right padding
        link.style.marginBottom = '2px'; // Add spacing between items
        
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

        // N1P3 Box
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

        const chartConfig = {
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
                    // Our custom plugin for point highlighting is now registered globally
                    highlightDataPoint: {
                        // This is empty because the plugin is registered at the top of the file
                    },
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
                    const chart = charts[chartId];
                    if (chart) {
                        const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: false }, true);
                        if (points.length) {
                            e.native.target.style.cursor = 'pointer';
                        } else {
                            e.native.target.style.cursor = 'default';
                        }
                    }
                }
            }
        };

        // Check if there's a saved zoom state
        const oldChart = existingCharts[chartId];
        const savedState = currentZoomState[chartId];
        
        // Create the chart
        charts[chartId] = new Chart(ctx, chartConfig);
        
        // Store timestamps if available
        if (data[sheetName].y4) {
            charts[chartId].timestamps = data[sheetName].y4;
        }
        
        // Apply zoom state if we have one
        if (savedState && charts[chartId]) {
            try {
                const newDataLength = charts[chartId].data.labels.length;
                
                if (savedState.isViewingLatest) {
                    // If viewing the latest data, adjust the view to show the same number of points
                    // but shifted to include any new data points
                    const pointsToShow = savedState.pointsVisible;
                    const newMin = Math.max(0, newDataLength - pointsToShow);
                    
                    charts[chartId].options.scales.x.min = newMin;
                    charts[chartId].options.scales.x.max = newDataLength - 1;
                } else {
                    // Otherwise, maintain the exact same view
                    charts[chartId].options.scales.x.min = savedState.min;
                    charts[chartId].options.scales.x.max = savedState.max;
                }
                
                // Update the chart with the saved zoom state
                charts[chartId].update();
            } catch (error) {
                console.error("Error restoring zoom state for " + chartId + ":", error);
            }
        }
    } // End of for-loop
    
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
    
    // Restore all scroll positions with multiple attempts
    restoreAllScrollPositions();
    
    // Try multiple approaches with increasing delays
    setTimeout(restoreAllScrollPositions, 100);
    setTimeout(restoreAllScrollPositions, 300);
    setTimeout(restoreAllScrollPositions, 500);
    setTimeout(restoreAllScrollPositions, 1000);
}

// Auto-refresh every 5 minutes
let refreshTimer;

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
        // Don't restart the timer, just restore scroll positions
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

// Function to set up automatic refresh - moved to end of script
function setupAutoRefresh() {
    // Only set up a new timer if one isn't already running
    if (!refreshTimer) {
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
				//fetchDataAndUpdateCharts();
            }
            
            // Log when the next refresh attempt will be
            const nextRefreshTime = new Date(Date.now() + 300000); // 5 minutes from now
            console.log("Next refresh attempt will be at:", nextRefreshTime.toLocaleTimeString());
        }, 300000); // Check every 5 minutes
    }
}