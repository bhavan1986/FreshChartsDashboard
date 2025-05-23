// Immediate scroll restoration to prevent flash to position 0 ONLY ISSUE is start of the selection box
(function() {
    // Immediately try to set scroll positions before any rendering
    if (localStorage.getItem('savedScrollPosition')) {
        const savedPos = parseInt(localStorage.getItem('savedScrollPosition'));
        if (savedPos > 0) {
            // Prevent flash by immediately scrolling to the saved position
            window.scrollTo(0, savedPos);
            console.log("PRE-RENDER: Scroll position set to", savedPos);
        }
    }
    
    // Also check for main content scroll position
    if (localStorage.getItem('mainContentScrollPosition')) {
        // We'll apply this after DOM is ready in DOMContentLoaded
        console.log("PRE-RENDER: Found saved main content position:", 
                   localStorage.getItem('mainContentScrollPosition'));
    }
})();

// Simple scroll position retention system
let savedScrollPosition = localStorage.getItem('savedScrollPosition') ? 
    parseInt(localStorage.getItem('savedScrollPosition')) : 0;
let savedSidebarPosition = localStorage.getItem('sidebarScrollPosition') ? 
    parseInt(localStorage.getItem('sidebarScrollPosition')) : 0;
let savedMainContentPosition = localStorage.getItem('mainContentScrollPosition') ?
    parseInt(localStorage.getItem('mainContentScrollPosition')) : 0;
let forceScrollInterval = null;
let isRefreshing = false; // Flag to track if we're in the middle of refreshing

// Function to identify scrollable containers and store references
let mainContentContainer = null;
let sidebarContainer = null;

function identifyScrollableContainers() {
    // Try to identify the main content container
    mainContentContainer = document.getElementById('charts-container');
    console.log("Main content container identified:", mainContentContainer);
    
    // Try to identify the sidebar container
    sidebarContainer = document.getElementById('sidebar');
    console.log("Sidebar container identified:", sidebarContainer);
    
    // Set up scroll listeners for the main content container
    if (mainContentContainer) {
        mainContentContainer.addEventListener('scroll', function() {
            // Save main content scroll position
            savedMainContentPosition = mainContentContainer.scrollTop;
            localStorage.setItem('mainContentScrollPosition', String(savedMainContentPosition));
            console.log("Main content scroll position saved:", savedMainContentPosition);
        });
    }
    
    return {
        mainContent: mainContentContainer,
        sidebar: sidebarContainer
    };
}

// Helper function to safely check if a timestamp is around 3:50 PM
/*function is350PMTimestamp(value) {
    // Handle any possible type safely
    if (value === null || value === undefined) return false;
    
    // Try to convert to string safely
    let str = "";
    try {
        // Try different approaches to get a string
        if (typeof value === "string") {
            str = value;
        } else if (typeof value.toString === "function") {
            str = value.toString();
        } else {
            str = "" + value; // Force string conversion
        }
    } catch (e) {
        console.log("Error converting timestamp to string:", e);
        return false;
    }
    
    // Check for "3:50" or "15:50" with more precision to avoid matching "13:50" or "1:50"
    // This looks for either "3:50" preceded by a non-digit (to avoid "13:50") 
    // or "15:50" specifically for 24-hour format
    
    // Check for "3:50" not preceded by a digit (to avoid "13:50", "23:50", etc)
    const has350 = /[^0-9]3:50/.test(" " + str); // Add space to handle case where "3:50" is at the start
    
    // Check for "15:50" in 24-hour format
    const has1550 = str.indexOf("15:50") >= 0;
    
    // Check for "3:50 PM" explicitly (most reliable indicator)
    const has350PM = str.indexOf("3:50 PM") >= 0 || str.indexOf("3:50PM") >= 0;
    
    // Debug logging to see what's being detected
    if (has350 || has1550 || has350PM) {
        console.log("Found 3:50 PM timestamp:", str);
    }
    
    return has350 || has1550 || has350PM;
}*/

function is400PMTimestamp(value) {
    // Handle any possible type safely
    if (value === null || value === undefined) return false;
    
    // Try to convert to string safely
    let str = "";
    try {
        // Try different approaches to get a string
        if (typeof value === "string") {
            str = value;
        } else if (typeof value.toString === "function") {
            str = value.toString();
        } else {
            str = "" + value; // Force string conversion
        }
    } catch (e) {
        console.log("Error converting timestamp to string:", e);
        return false;
    }
    
    // Check for "4:00" or "16:00" with more precision to avoid matching "14:00" or "1:00"
    // This looks for either "4:00" preceded by a non-digit (to avoid "14:00") 
    // or "16:00" specifically for 24-hour format
    
    // Check for "4:00" not preceded by a digit (to avoid "14:00", "24:00", etc)
    const has400 = /[^0-9]4:00/.test(" " + str); // Add space to handle case where "4:00" is at the start
    
    // Check for "16:00" in 24-hour format
    const has1600 = str.indexOf("16:00") >= 0;
    
    // Check for "4:00 PM" explicitly (most reliable indicator)
    const has400PM = str.indexOf("4:00 PM") >= 0 || str.indexOf("4:00PM") >= 0;
    
    // Debug logging to see what's being detected
    if (has400 || has1600 || has400PM) {
        console.log("Found 4:00 PM timestamp:", str);
    }
    
    return has400 || has1600 || has400PM;
}



// Store initial scroll position on page load
window.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded - identifying containers");
    
    // Identify all scrollable containers
    const containers = identifyScrollableContainers();
    
    // Check if there's a saved window position
    if (localStorage.getItem('savedScrollPosition')) {
        savedScrollPosition = parseInt(localStorage.getItem('savedScrollPosition'));
        console.log("Found saved window scroll position:", savedScrollPosition);
        
        // Restore main window position immediately
        if (savedScrollPosition > 0) {
            window.scrollTo(0, savedScrollPosition);
        }
    } else {
        console.log("No saved window scroll position found, using default: 0");
    }
    
    // Check for saved main content position
    if (localStorage.getItem('mainContentScrollPosition') && containers.mainContent) {
        savedMainContentPosition = parseInt(localStorage.getItem('mainContentScrollPosition'));
        console.log("Found saved main content scroll position:", savedMainContentPosition);
        
        // Restore main content position immediately
        if (savedMainContentPosition > 0) {
            containers.mainContent.scrollTop = savedMainContentPosition;
        }
    } else {
        console.log("No saved main content scroll position found, using default: 0");
    }
    
    // Find and set up the sidebar
    if (containers.sidebar) {
        // Add scroll event listener to the sidebar if not already set
        containers.sidebar.addEventListener('scroll', function() {
            // Save sidebar scroll position
            savedSidebarPosition = containers.sidebar.scrollTop;
            localStorage.setItem('sidebarScrollPosition', String(savedSidebarPosition));
            console.log("Sidebar scroll position saved:", savedSidebarPosition);
        });
        
        // Try to restore sidebar position
        if (localStorage.getItem('sidebarScrollPosition')) {
            savedSidebarPosition = parseInt(localStorage.getItem('sidebarScrollPosition'));
            containers.sidebar.scrollTop = savedSidebarPosition;
            console.log("Sidebar scroll position restored:", containers.sidebar.scrollTop);
        }
    }
    
    // Log initial positions
    console.log("DOMContentLoaded - current positions - Window:", window.scrollY, 
               "Sidebar:", containers.sidebar ? containers.sidebar.scrollTop : 'N/A',
               "Main Content:", containers.mainContent ? containers.mainContent.scrollTop : 'N/A');
});

// Save positions before unload
window.addEventListener('beforeunload', function() {
    // Get references to containers
    const mainContent = mainContentContainer || document.getElementById('charts-container');
    const sidebar = sidebarContainer || document.getElementById('sidebar');
    
    // Main window position
    const windowPos = window.scrollY || document.documentElement.scrollTop || 0;
    if (windowPos > 0) {
        localStorage.setItem('savedScrollPosition', String(windowPos));
    }
    
    // Main content position
    if (mainContent) {
        const mainContentPos = mainContent.scrollTop || 0;
        if (mainContentPos > 0) {
            localStorage.setItem('mainContentScrollPosition', String(mainContentPos));
        }
    }
    
    // Sidebar position
    if (sidebar) {
        const sidebarPos = sidebar.scrollTop || 0;
        if (sidebarPos > 0) {
            localStorage.setItem('sidebarScrollPosition', String(sidebarPos));
        }
    }
    
    console.log("BEFOREUNLOAD: Saved positions - Window:", windowPos, 
               "Sidebar:", sidebar ? sidebar.scrollTop : 'N/A',
               "Main Content:", mainContent ? mainContent.scrollTop : 'N/A');
});

// Add window scroll event listener
window.addEventListener('scroll', function() {
    // Save main window position
    const currentPosition = window.scrollY || document.documentElement.scrollTop || 0;
    
    // Always update the saved position - more important to have the latest
    if (currentPosition > 0) {
        savedScrollPosition = currentPosition;
        localStorage.setItem('savedScrollPosition', String(currentPosition));
        console.log("Window scroll position saved:", currentPosition);
    }
});

// Regular chart variables
let charts = {};
let currentZoomState = {};
let scrollPositions = {
    main: 0,
    sidebar: 0,
    chartsContainer: 0
};

// Track mouse position globally
let globalMouseX = 0;
let globalMouseY = 0;
let activeChartId = null;

// Auto-refresh timer
let refreshTimer = null;

// Register custom plugin for point highlighting and vertical line alignment
Chart.register({
    id: 'highlightDataPoint',
    beforeDraw: function(chart) {
        if (!chart.tooltip || !chart.tooltip._active || chart.tooltip._active.length === 0) return;
        
        const ctx = chart.ctx;
        const activeElements = chart.tooltip._active;
        const activePoint = activeElements[0];
        const dataIndex = activePoint.index;
        
        // First, get the position of the active point
        const x = activePoint.element.x;
        const chartPosition = chart.canvas.getBoundingClientRect();
        
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
            const dataPointX = point.x;
            const dataPointY = point.y;
            
            // Save the current drawing state
            ctx.save();
            
            // Draw outer highlight circle
            ctx.beginPath();
            ctx.arc(dataPointX, dataPointY, 8, 0, 2 * Math.PI);
            ctx.fillStyle = dataset.backgroundColor || 'blue';
            ctx.fill();
            
            // Draw white border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Restore the drawing state
            ctx.restore();
        });
        
        // Now update the vertical line to align with the active data point
        const verticalLine = document.getElementById('chartjs-vertical-line');
        
        if (!verticalLine) {
            // Create the vertical line if it doesn't exist
            const newVerticalLine = document.createElement('div');
            newVerticalLine.id = 'chartjs-vertical-line';
            newVerticalLine.style.position = 'absolute';
            newVerticalLine.style.pointerEvents = 'none';
            newVerticalLine.style.zIndex = '999';
            document.body.appendChild(newVerticalLine);
            
            // Position the vertical line at the active data point
            newVerticalLine.style.opacity = '1';
            newVerticalLine.style.borderLeft = '2px dashed rgba(0, 0, 0, 0.7)';
            newVerticalLine.style.left = (chartPosition.left + x) + 'px';
            newVerticalLine.style.top = chartPosition.top + 'px';
            newVerticalLine.style.height = chartPosition.height + 'px';
        } else {
            // Update the existing vertical line
            verticalLine.style.opacity = '1';
            verticalLine.style.left = (chartPosition.left + x) + 'px';
            verticalLine.style.top = chartPosition.top + 'px';
            verticalLine.style.height = chartPosition.height + 'px';
        }
    }
});

// Modified function to create the RV Drop% table with swapped rows 2 and 3
function createRVDropTable(chartId, xLabels, rvData, plData, stockMoveData, timestamps) {
    try {
        // Check if there's an existing table to remove
        const existingTable = document.getElementById(`${chartId}_rv_table`);
        if (existingTable) {
            existingTable.remove();
        }
        
        // Create a container for the table
        const tableContainer = document.createElement('div');
        tableContainer.id = `${chartId}_rv_table`;
        tableContainer.className = 'rv-drop-table';
        tableContainer.style.marginLeft = '5px';
        tableContainer.style.flex = '1';
        tableContainer.style.maxWidth = '50%';
        tableContainer.style.overflowX = 'auto';
        tableContainer.style.maxHeight = '80px'; // Keep the same height but without title
        tableContainer.style.overflowY = 'auto'; // Add vertical scrolling
        
        // Create the table
        const table = document.createElement('table');
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';
        table.style.fontSize = '11.5px';
        table.style.border = '1px solid #ddd';
        
        // Helper function to extract date from timestamp
        function extractDate(timestamp) {
            if (!timestamp) return null;
            
            let dateStr = "";
            try {
                // Handle different timestamp formats
                const str = timestamp.toString();
                
                // Typical date formats: MM/DD/YYYY or YYYY-MM-DD
                if (str.includes('/')) {
                    dateStr = str.split(' ')[0]; // Get date part before time
                } else if (str.includes('-')) {
                    dateStr = str.split('T')[0]; // Get date part before T
                }
                
                return dateStr;
            } catch (e) {
                console.error("Error extracting date:", e);
                return null;
            }
        }
        
        // Create header row
        const headerRow = document.createElement('tr');
        
        // Add X-axis label header
        const xHeader = document.createElement('th');
        xHeader.textContent = 'T MINUS';
        xHeader.style.padding = '2px';
        xHeader.style.backgroundColor = '#f2f2f2';
        xHeader.style.border = '1px solid #ddd';
        xHeader.style.textAlign = 'center';
        headerRow.appendChild(xHeader);
        
        // Get unique X values and sort them
        let uniqueXValues = [];
        for (let i = 0; i < xLabels.length; i++) {
            if (uniqueXValues.indexOf(xLabels[i]) === -1) {
                uniqueXValues.push(xLabels[i]);
            }
        }
        
        // Sort unique values
        uniqueXValues.sort(function(a, b) {
            // Try to convert to numbers if possible
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numB - numA; // Descending order for numeric values
            }
            // Fallback to string comparison
            return String(a).localeCompare(String(b));
        });
        
        // Add X value headers
        for (let i = 0; i < uniqueXValues.length; i++) {
            const xValue = uniqueXValues[i];
            const th = document.createElement('th');
            th.textContent = xValue;
            th.style.padding = '2px';
            th.style.backgroundColor = '#f2f2f2';
            th.style.border = '1px solid #ddd';
            th.style.textAlign = 'center';
            headerRow.appendChild(th);
        }
        
        table.appendChild(headerRow);
        
        // Create the three data rows
        const rvDataRow = document.createElement('tr');
        const stockMoveDataRow = document.createElement('tr'); // SWAPPED - moved up one position
        const plDataRow = document.createElement('tr'); // SWAPPED - moved down one position
        
        // Add labels for each row
        const rvLabel = document.createElement('td');
        rvLabel.textContent = 'RV Drop%';
        rvLabel.style.padding = '2px';
        rvLabel.style.fontWeight = 'bold';
        rvLabel.style.backgroundColor = '#f2f2f2';
        rvLabel.style.border = '1px solid #ddd';
        rvLabel.style.textAlign = 'center';
        rvDataRow.appendChild(rvLabel);
        
        // SWAPPED - Stock Move label is now added to the second row
        const stockMoveLabel = document.createElement('td');
        stockMoveLabel.textContent = 'Avg Stock Move from Open%';
        stockMoveLabel.style.padding = '2px';
        stockMoveLabel.style.fontWeight = 'bold';
        stockMoveLabel.style.backgroundColor = '#f2f2f2';
        stockMoveLabel.style.border = '1px solid #ddd';
        stockMoveLabel.style.textAlign = 'center';
        stockMoveDataRow.appendChild(stockMoveLabel);
        
        // SWAPPED - P/L label is now added to the third row
        const plLabel = document.createElement('td');
        plLabel.textContent = 'Avg P/L%';
        plLabel.style.padding = '2px';
        plLabel.style.fontWeight = 'bold';
        plLabel.style.backgroundColor = '#f2f2f2';
        plLabel.style.border = '1px solid #ddd';
        plLabel.style.textAlign = 'center';
        plDataRow.appendChild(plLabel);
        
        // Process each unique X value
        for (let i = 0; i < uniqueXValues.length; i++) {
            const xValue = uniqueXValues[i];
            
            // Find all indices where xLabels matches this xValue
            let matchingIndices = [];
            for (let j = 0; j < xLabels.length; j++) {
                if (xLabels[j] === xValue) {
                    matchingIndices.push(j);
                }
            }
            
            // Group by date for better organization
            const dateGroups = {};
            
            for (let j = 0; j < matchingIndices.length; j++) {
                const idx = matchingIndices[j];
                if (idx >= 0 && idx < timestamps.length) {
                    const timestamp = timestamps[idx];
                    const date = extractDate(timestamp) || "Unknown";
                    
                    if (!dateGroups[date]) {
                        dateGroups[date] = {
                            rvPoints: [],
                            plPoints: [],
                            stockMovePoints: []
                        };
                    }
                    
                    // Add data points with timestamp info
                    dateGroups[date].rvPoints.push({
                        index: idx,
                        timestamp: timestamp,
                        //is350: is350PMTimestamp(timestamp),
						is400: is400PMTimestamp(timestamp),
                        value: rvData[idx]
                    });
                    
                    // Add P/L data points if available
                    if (plData && idx < plData.length) {
                        dateGroups[date].plPoints.push({
                            index: idx,
                            timestamp: timestamp,
                            //is350: is350PMTimestamp(timestamp),
							is400: is400PMTimestamp(timestamp),
                            value: plData[idx]
                        });
                    }
                    
                    // Add Stock Move data points if available
                    if (stockMoveData && idx < stockMoveData.length) {
                        dateGroups[date].stockMovePoints.push({
                            index: idx,
                            timestamp: timestamp,
                            //is350: is350PMTimestamp(timestamp),
							is400: is400PMTimestamp(timestamp),
                            value: stockMoveData[idx]
                        });
                    }
                }
            }
            
            // Get the most recent date that has data
            const sortedDates = Object.keys(dateGroups).sort().reverse();
            
            // --- RV DROP% CELL ---
            const rvCell = document.createElement('td');
            rvCell.style.padding = '2px';
            rvCell.style.border = '1px solid #ddd';
            rvCell.style.textAlign = 'center';
            
            let rvTargetValue = null;
            let rvTargetTime = null;
            
            if (sortedDates.length > 0) {
                const latestDate = sortedDates[0];
                const dataPointsForLatestDate = dateGroups[latestDate].rvPoints;
                
                // Check if there's a 3:50 PM value for this date
                //let found350 = false;
				let found400 = false;
                
                for (const dataPoint of dataPointsForLatestDate) {
                    if (dataPoint.is400 && 
					//if (dataPoint.is350 &&
                        dataPoint.value !== null && 
                        dataPoint.value !== undefined && 
                        !isNaN(dataPoint.value)) {
                        // Found a valid 3:50 PM value
                        rvTargetValue = dataPoint.value;
                        rvTargetTime = dataPoint.timestamp;
                        found400 = true;
						//found350 = true;
                        break;
                    }
                }
                
                // If no 3:50 PM value, use the latest valid value for this date
                //if (!found350) {
				if (!found400) {
                    // Sort data points by timestamp in descending order (latest first)
                    const sortedPoints = [...dataPointsForLatestDate].sort((a, b) => {
                        // Simple string comparison should work for most timestamp formats
                        return String(b.timestamp).localeCompare(String(a.timestamp));
                    });
                    
                    // Find the latest valid value
                    for (const dataPoint of sortedPoints) {
                        if (dataPoint.value !== null && 
                            dataPoint.value !== undefined && 
                            !isNaN(dataPoint.value)) {
                            rvTargetValue = dataPoint.value;
                            rvTargetTime = dataPoint.timestamp;
                            break;
                        }
                    }
                }
            }
            
            // Format and display the RV value with color coding
            if (rvTargetValue !== null) {
                const formattedValue = (rvTargetValue * 100).toFixed(2) + '%';
                // Color green if positive, red if negative
                const textColor = rvTargetValue >= 0 ? '#00A86B' : 'red';
                
                // Add the timestamp as a title/tooltip for information
                if (rvTargetTime) {
                    rvCell.title = `Time: ${rvTargetTime}`;
                }
                
                // Check if value is less than -7% to make it bold
                const isBelowThreshold = rvTargetValue < -0.07; // -7% as a decimal
                
                // Add bold styling if below threshold
                if (isBelowThreshold) {
                    rvCell.innerHTML = `<span style="color: ${textColor}; font-weight: bold;">${formattedValue}</span>`;
                } else {
                    rvCell.innerHTML = `<span style="color: ${textColor}">${formattedValue}</span>`;
                }
            } else {
                rvCell.textContent = 'N/A';
            }
            
            rvDataRow.appendChild(rvCell);
            
            // --- STOCK MOVE% CELL (AVERAGE) --- SWAPPED - now in the second row
            const stockMoveCell = document.createElement('td');
            stockMoveCell.style.padding = '2px';
            stockMoveCell.style.border = '1px solid #ddd';
            stockMoveCell.style.textAlign = 'center';
            
            let stockMoveAvgValue = null;
            let stockMoveTimestampInfo = "";
            
            if (sortedDates.length > 0 && stockMoveData) {
                const latestDate = sortedDates[0];
                const dataPointsForLatestDate = dateGroups[latestDate].stockMovePoints;
                
                // Calculate average Stock Move% for this date
                let validValues = [];
                
                for (const dataPoint of dataPointsForLatestDate) {
                    if (dataPoint.value !== null && 
                        dataPoint.value !== undefined && 
                        !isNaN(dataPoint.value)) {
                        validValues.push(dataPoint.value);
                    }
                }
                
                if (validValues.length > 0) {
                    // Calculate average
                    const sum = validValues.reduce((acc, val) => acc + val, 0);
                    stockMoveAvgValue = sum / validValues.length;
                    stockMoveTimestampInfo = `Average of ${validValues.length} data points on ${latestDate}`;
                }
            }
            
            // Format and display the Stock Move average value with color coding
            if (stockMoveAvgValue !== null) {
                const formattedValue = (stockMoveAvgValue * 100).toFixed(2) + '%';
                
                // NEW COLOR LOGIC FOR STOCK MOVE:
                // Use green for values > 2% or < -2%, gold/yellow for values in between
                let textColor;
                if (stockMoveAvgValue > 0.02 || stockMoveAvgValue < -0.02) {
                    textColor = '#00A86B'; // Green for significant moves (>2% or <-2%)
                } else {
                    textColor = 'grey'; // Grey for smaller moves (same as chart color)
                }
                
                // Add information as a title/tooltip
                stockMoveCell.title = stockMoveTimestampInfo;
                
                // Check if value is less than -7% to make it bold
                const isBelowThreshold = stockMoveAvgValue < -0.07; // -7% as a decimal
                
                // Add bold styling if below threshold
                if (isBelowThreshold) {
                    stockMoveCell.innerHTML = `<span style="color: ${textColor}; font-weight: bold;">${formattedValue}</span>`;
                } else {
                    stockMoveCell.innerHTML = `<span style="color: ${textColor}">${formattedValue}</span>`;
                }
            } else {
                stockMoveCell.textContent = 'N/A';
            }
            
            stockMoveDataRow.appendChild(stockMoveCell);
            
            // --- P/L% CELL (AVERAGE) --- SWAPPED - now in the third row
            const plCell = document.createElement('td');
            plCell.style.padding = '2px';
            plCell.style.border = '1px solid #ddd';
            plCell.style.textAlign = 'center';
            
            let plAvgValue = null;
            let plTimestampInfo = "";
            
            if (sortedDates.length > 0 && plData) {
                const latestDate = sortedDates[0];
                const dataPointsForLatestDate = dateGroups[latestDate].plPoints;
                
                // Calculate average P/L% for this date
                let validValues = [];
                
                for (const dataPoint of dataPointsForLatestDate) {
                    if (dataPoint.value !== null && 
                        dataPoint.value !== undefined && 
                        !isNaN(dataPoint.value)) {
                        validValues.push(dataPoint.value);
                    }
                }
                
                if (validValues.length > 0) {
                    // Calculate average
                    const sum = validValues.reduce((acc, val) => acc + val, 0);
                    plAvgValue = sum / validValues.length;
                    plTimestampInfo = `Average of ${validValues.length} data points on ${latestDate}`;
                }
            }
            
            // Format and display the P/L average value with color coding
            if (plAvgValue !== null) {
                const formattedValue = (plAvgValue * 100).toFixed(2) + '%';
                // Color green if positive, red if negative
                const textColor = plAvgValue >= 0 ? 'green' : 'red';
                
                // Add information as a title/tooltip
                plCell.title = plTimestampInfo;
                
                // Check if value is less than -7% to make it bold
                const isBelowThreshold = plAvgValue < -0.07; // -7% as a decimal
                
                // Add bold styling if below threshold
                if (isBelowThreshold) {
                    plCell.innerHTML = `<span style="color: ${textColor}; font-weight: bold;">${formattedValue}</span>`;
                } else {
                    plCell.innerHTML = `<span style="color: ${textColor}">${formattedValue}</span>`;
                }
            } else {
                plCell.textContent = 'N/A';
            }
            
            plDataRow.appendChild(plCell);
        }
        
        // Add all rows to the table in the new order
        table.appendChild(rvDataRow);
        table.appendChild(stockMoveDataRow); // SWAPPED - now second
        table.appendChild(plDataRow); // SWAPPED - now third
        
        // Add table to container
        tableContainer.appendChild(table);
        
        return tableContainer;
    } catch (error) {
        console.error("Error creating multi-row table:", error);
        // Create minimal error container
        const errorDiv = document.createElement('div');
        errorDiv.id = `${chartId}_rv_table`;
        errorDiv.textContent = "Data table unavailable";
        errorDiv.style.color = "red";
        return errorDiv;
    }
}

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

// Add CSS for RV Drop table and layout
function addRVDropTableStyles() {
    // Check if styles already exist
    if (document.getElementById('rv-drop-table-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'rv-drop-table-styles';
    style.textContent = `
    .rv-drop-table {
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        background-color: white;
        overflow-x: auto;
    }

    .rv-drop-table table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
    }

    .rv-drop-table th, .rv-drop-table td {
        padding: 2px 3px;
        border: 1px solid #ddd;
        text-align: center;
    }

    .rv-drop-table th {
        background-color: #f2f2f2;
        font-weight: bold;
    }
    
    .n1p3-box {
        border: 1px solid #ddd;
        padding: 2px;
        background-color: #f8f8f8;
        border-radius: 4px;
        font-size: 11px;
        overflow: auto;
    }
    
    .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
        width: 100%;
    }

    .reset-zoom-btn {
        padding: 4px 8px;
        background-color: #f2f2f2;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 5px;
    }
    
    .reset-zoom-btn:hover {
        background-color: #e6e6e6;
    }

    .chart-controls {
        display: flex;
        justify-content: flex-end;
        margin: 5px 0;
        align-items: center;
    }
    
    .zoom-hint {
        font-size: 11px;
        color: #666;
        margin-right: 5px;
    }

    /* Make table more responsive */
    @media (max-width: 768px) {
        .rv-drop-table table {
            font-size: 10px;
        }
        .rv-drop-table th, .rv-drop-table td {
            padding: 1px 2px;
        }
        .n1p3-box {
            font-size: 10px;
        }
    }
    `;
    document.head.appendChild(style);
}

// Function to preserve scroll positions during updates
function preserveScrollPositions() {
    // Get references to containers if not already set
    if (!mainContentContainer) {
        mainContentContainer = document.getElementById('charts-container');
    }
    if (!sidebarContainer) {
        sidebarContainer = document.getElementById('sidebar');
    }
    
    // Store current positions in global variables
    window.mainScrollPosition = window.scrollY || document.documentElement.scrollTop || 0;
    
    if (sidebarContainer) {
        window.sidebarScrollPosition = sidebarContainer.scrollTop || 0;
    }
    
    if (mainContentContainer) {
        window.mainContentScrollPosition = mainContentContainer.scrollTop || 0;
    }
    
    console.log("PRESERVING POSITIONS - Window:", window.mainScrollPosition, 
               "Sidebar:", window.sidebarScrollPosition,
               "Main Content:", window.mainContentScrollPosition);
    
    // Save to localStorage for persistence
    if (window.mainScrollPosition > 0) {
        localStorage.setItem('savedScrollPosition', String(window.mainScrollPosition));
        savedScrollPosition = window.mainScrollPosition;
    }
    
    if (window.sidebarScrollPosition > 0) {
        localStorage.setItem('sidebarScrollPosition', String(window.sidebarScrollPosition));
        savedSidebarPosition = window.sidebarScrollPosition;
    }
    
    if (window.mainContentScrollPosition > 0) {
        localStorage.setItem('mainContentScrollPosition', String(window.mainContentScrollPosition));
        savedMainContentPosition = window.mainContentScrollPosition;
    }
}

// Improved function to fix scroll position - call this AFTER content is loaded
function fixScroll() {
    // Get references to containers if not already set
    if (!mainContentContainer) {
        mainContentContainer = document.getElementById('charts-container');
    }
    if (!sidebarContainer) {
        sidebarContainer = document.getElementById('sidebar');
    }
    
    // Get saved positions from global variables first, or fall back to saved variables
    const windowPos = window.mainScrollPosition || savedScrollPosition || 0;
    const sidebarPos = window.sidebarScrollPosition || savedSidebarPosition || 0;
    const mainContentPos = window.mainContentScrollPosition || savedMainContentPosition || 0;
    
    console.log("FIXING SCROLL - Target positions - Window:", windowPos, 
               "Sidebar:", sidebarPos,
               "Main Content:", mainContentPos);
    
    // More aggressive restoration for main window
    if (windowPos > 0) {
        try {
            // Use multiple methods for better browser compatibility
            window.scrollTo(0, windowPos);
            document.documentElement.scrollTop = windowPos;
            document.body.scrollTop = windowPos;
            console.log("Window scroll position forced to:", windowPos);
        } catch(e) {
            console.error("Error in window scroll restoration:", e);
        }
    }
    
    // For sidebar scroll
    if (sidebarContainer && sidebarPos > 0) {
        sidebarContainer.scrollTop = sidebarPos;
        console.log("Sidebar position restored to:", sidebarPos);
    }
    
    // For main content scroll
    if (mainContentContainer && mainContentPos > 0) {
        mainContentContainer.scrollTop = mainContentPos;
        console.log("Main content position restored to:", mainContentPos);
    }
}

// Set up position watcher to continuously restore during DOM updates
function setupPositionWatcher() {
    // Get the positions to maintain
    const windowPos = window.mainScrollPosition || savedScrollPosition || 0;
    const sidebarPos = window.sidebarScrollPosition || savedSidebarPosition || 0;
    const mainContentPos = window.mainContentScrollPosition || savedMainContentPosition || 0;
    
    // Skip if no positions to restore
    if (windowPos <= 0 && sidebarPos <= 0 && mainContentPos <= 0) return;
    
    console.log("SETTING UP POSITION WATCHER - Window:", windowPos, 
               "Sidebar:", sidebarPos,
               "Main Content:", mainContentPos);
    
    // Create interval to continuously check and restore positions
    let attempts = 0;
    const maxAttempts = 20;
    const watcher = setInterval(() => {
        attempts++;
        
        // Get references to containers in case they've changed
        const mainContent = document.getElementById('charts-container');
        const sidebar = document.getElementById('sidebar');
        
        // Restore main window position
        if (windowPos > 0) {
            window.scrollTo(0, windowPos);
        }
        
        // Restore sidebar position
        if (sidebarPos > 0 && sidebar) {
            sidebar.scrollTop = sidebarPos;
        }
        
        // Restore main content position
        if (mainContentPos > 0 && mainContent) {
            mainContent.scrollTop = mainContentPos;
        }
        
        // Log progress
        if (attempts % 5 === 0) {
            console.log(`POSITION WATCHER (${attempts}/${maxAttempts}): Current Window=${window.scrollY}, Target=${windowPos}, Current Main=${mainContent ? mainContent.scrollTop : 'N/A'}, Target=${mainContentPos}`);
        }
        
        // Stop after max attempts
        if (attempts >= maxAttempts) {
            clearInterval(watcher);
            console.log("POSITION WATCHER COMPLETE");
        }
    }, 100);
}

async function fetchDataAndUpdateCharts() {
    // Preserve current scroll positions before doing anything
    preserveScrollPositions();
    
    console.log("Starting data refresh, saved positions - Window:", savedScrollPosition, 
               "Sidebar:", savedSidebarPosition,
               "Main Content:", savedMainContentPosition);
    
    // Add RV Drop Table styles
    addRVDropTableStyles();
    
    // Save current zoom states for all charts
    for (let chartId in charts) {
        const chart = charts[chartId];
        if (!chart || !chart.scales) continue;
        
        // Store exact min/max values for both x and y axes
        currentZoomState[chartId] = {
            // X-axis zoom state
            xMin: chart.scales.x.min,
            xMax: chart.scales.x.max,
            isViewingLatest: (chart.scales.x.max === undefined || 
                             chart.scales.x.max >= chart.data.labels.length - 1),
            dataLength: chart.data.labels.length,
            pointsVisible: chart.scales.x.max !== undefined && chart.scales.x.min !== undefined ? 
                          (chart.scales.x.max - chart.scales.x.min + 1) : chart.data.labels.length,
            
            // Y-axis zoom state for both y axes
            y1Min: chart.scales.y1.min,
            y1Max: chart.scales.y1.max,
            y2Min: chart.scales.y2.min,
            y2Max: chart.scales.y2.max
        };
    }
    
    // Remember search value if it exists
    let searchValue = '';
    const searchInput = document.getElementById('chart-search');
    if (searchInput) {
        searchValue = searchInput.value;
    }
    
    // Create or ensure the fixed container exists before clearing anything
    let sidebar = document.getElementById('sidebar');
    let fixedContainer = document.getElementById('fixed-sidebar-elements');
    
    if (!fixedContainer) {
        // If no fixed container yet, create it
        createSearchBar(sidebar); // This will create the fixed container
        fixedContainer = document.getElementById('fixed-sidebar-elements');
    }
    
    // Start the position watcher before DOM manipulation
    setupPositionWatcher();
    
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

        // Create a row for N1P3 box and RV Drop table side by side
        const infoRow = document.createElement('div');
        infoRow.className = 'info-row';
        infoRow.style.display = 'flex';
        infoRow.style.justifyContent = 'space-between';
        infoRow.style.marginBottom = '5px';
        infoRow.style.width = '100%';
        
        // N1P3 Box - now takes half width
        const n1p3Div = document.createElement('div');
        n1p3Div.className = 'n1p3-box';
        n1p3Div.style.flex = '1';
        n1p3Div.style.marginRight = '5px';
        n1p3Div.style.maxWidth = '50%';
        
        // Add row numbers to see what's being shown
        n1p3Div.innerHTML = data[sheetName].n1p3.map(row => row.join(' | ')).join('<br>');
        
        // Add these lines to directly constrain the height:
        n1p3Div.style.maxHeight = '80px'; // Set your desired height here
        n1p3Div.style.overflowY = 'auto'; // Add scrollbar when content overflows
        n1p3Div.style.overflowX = 'auto'; // Add scrollbar when content overflows
        n1p3Div.style.padding = '3px';
        n1p3Div.style.fontSize = '14px';

        // Create RV Drop table early - to be placed next to N1P3 box
        const rvDropTable = createRVDropTable(chartId, xLabels, y3, y1, y2, data[sheetName].y4);
        rvDropTable.style.flex = '1';
        rvDropTable.style.maxWidth = '50%';
        
        // Add both to the info row
        infoRow.appendChild(n1p3Div);
        infoRow.appendChild(rvDropTable);
        
        // Add info row to the chart div
        chartDiv.appendChild(infoRow);

        // Canvas
        const canvas = document.createElement('canvas');
        chartDiv.appendChild(canvas);

        // Modify the double-click event listener to check for the shift key
canvas.addEventListener('dblclick', function(event) {
    if (charts[chartId]) {
        if (event.shiftKey) {
            // Shift+Double-click: Reset only X axis
            charts[chartId].options.scales.x.min = undefined;
            charts[chartId].options.scales.x.max = undefined;
            charts[chartId].update();
            console.log('Reset X axis only via Shift+Double-click');
        } else {
            // Regular Double-click: Reset both X and Y axes
            charts[chartId].options.scales.x.min = undefined;
            charts[chartId].options.scales.x.max = undefined;
            charts[chartId].options.scales.y1.min = paddedMinY;
            charts[chartId].options.scales.y1.max = paddedMaxY;
            charts[chartId].options.scales.y2.min = paddedMinY;
            charts[chartId].options.scales.y2.max = paddedMaxY;
            charts[chartId].update();
            console.log('Reset all axes via Double-click');
        }
    }
});
        
        // Add mouseout event to hide vertical line
        canvas.addEventListener('mouseout', function() {
            const verticalLine = document.getElementById('chartjs-vertical-line');
            if (verticalLine) {
                verticalLine.style.opacity = '0';
            }
        });

        // Add wheel pan with shift key functionality
        canvas.addEventListener('wheel', function(e) {
            if (e.shiftKey && charts[chartId]) {
                e.preventDefault();
                
                // Get current extremes
                const chart = charts[chartId];
                const currentMin = chart.scales.x.min;
                const currentMax = chart.scales.x.max;
                
                // If min/max are undefined (not zoomed), set them to the current range
                if (currentMin === undefined || currentMax === undefined) {
                    const dataMin = chart.scales.x.min;
                    const dataMax = chart.scales.x.max;
                    chart.options.scales.x.min = dataMin;
                    chart.options.scales.x.max = dataMax;
                }
                
                // Calculate panning amount (adjust this value to control pan speed)
                const range = chart.scales.x.max - chart.scales.x.min;
                const panAmount = range * 0.05;
                
                // Pan left or right based on wheel direction
                if (e.deltaY > 0) {
                    chart.options.scales.x.min += panAmount;
                    chart.options.scales.x.max += panAmount;
                } else {
                    chart.options.scales.x.min -= panAmount;
                    chart.options.scales.x.max -= panAmount;
                }
                
                chart.update();
            }
        });

        // Chart controls with zoom info
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'chart-controls';
        controlsDiv.style.display = 'flex';
        controlsDiv.style.justifyContent = 'flex-end';
        controlsDiv.style.alignItems = 'center';
        controlsDiv.style.margin = '5px 0';
        
        // Add zoom hint
        const zoomHint = document.createElement('span');
        zoomHint.className = 'zoom-hint';
        zoomHint.innerHTML = 'CTRL+Wheel to zoom, Shift+Wheel to pan, Shift+Drag to move Horizontal/Vertical, Drag to Zoom| Shift + Double-click to reset X-axis, Double-click to reset Both Axes';
        zoomHint.style.fontSize = '11px';
        zoomHint.style.color = '#666';
        zoomHint.style.marginRight = '5px';
        controlsDiv.appendChild(zoomHint);
        
        // Reset X button
        const resetXBtn = document.createElement('button');
        resetXBtn.className = 'reset-zoom-btn';
        resetXBtn.innerText = 'Reset X';
        resetXBtn.onclick = function() {
            if (charts[chartId]) {
                charts[chartId].options.scales.x.min = undefined;
                charts[chartId].options.scales.x.max = undefined;
                charts[chartId].update();
            }
        };
        controlsDiv.appendChild(resetXBtn);
        
        // Reset Y button
        const resetYBtn = document.createElement('button');
        resetYBtn.className = 'reset-zoom-btn';
        resetYBtn.innerText = 'Reset Y';
        resetYBtn.onclick = function() {
            if (charts[chartId]) {
                charts[chartId].options.scales.y1.min = paddedMinY;
                charts[chartId].options.scales.y1.max = paddedMaxY;
                charts[chartId].options.scales.y2.min = paddedMinY;
                charts[chartId].options.scales.y2.max = paddedMaxY;
                charts[chartId].update();
            }
        };
        controlsDiv.appendChild(resetYBtn);
        
        // Reset All button
        const resetAllBtn = document.createElement('button');
        resetAllBtn.className = 'reset-zoom-btn';
        resetAllBtn.innerText = 'Reset All';
        resetAllBtn.onclick = function() {
            if (charts[chartId]) {
                charts[chartId].options.scales.x.min = undefined;
                charts[chartId].options.scales.x.max = undefined;
                charts[chartId].options.scales.y1.min = paddedMinY;
                charts[chartId].options.scales.y1.max = paddedMaxY;
                charts[chartId].options.scales.y2.min = paddedMinY;
                charts[chartId].options.scales.y2.max = paddedMaxY;
                charts[chartId].update();
            }
        };
        controlsDiv.appendChild(resetAllBtn);
        
        // Add controls to chart div
        chartDiv.appendChild(controlsDiv);
        
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
        limits: {
            // Define limits to prevent zooming too far in or out
            y: {minRange: 0.01},  // Ensure reasonable minimum y-axis range
            x: {minRange: 0.01}   // Ensure reasonable minimum x-axis range
        },
        pan: {
            enabled: true,
            mode: 'xy',       // Allow panning in both directions
            modifierKey: 'shift',  // Only pan when shift key is pressed
            threshold: 10    // Small threshold to avoid accidental pans
        },
        zoom: {
            wheel: {
                enabled: true,
                modifierKey: 'ctrl',
                speed: 0.1,    // A lower value makes zooming more gradual
                mode: 'y'      // Wheel only zooms Y axis when ctrl is pressed
            },
            pinch: {
                enabled: true
            },
            drag: {
                enabled: true,
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderColor: 'rgba(0,0,0,0.5)',
                borderWidth: 1,
                threshold: 10,   // Threshold to prevent accidental drags
                mode: 'xy'      // Drag zooms both axes
            },
            mode: 'xy'    // Default zoom mode affects both axes
        },
        // This event handler ensures the chart updates properly after zoom completes
        onZoomComplete: function({chart}) {
            chart.update('none');  // Update without animation for better performance
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
                                    
                                    if (typeof timestamp === 'string' && timestamp.indexOf('/') >= 0) {
                                        // If format is MM/DD/YYYY HH:MM
                                        const parts = timestamp.split(' ');
                                        const datePart = parts[0];
                                        const timePart = parts.length > 1 ? parts[1] : '';
                                        
                                        const dateParts = datePart.split('/');
                                        if (dateParts.length === 3) {
                                            const month = parseInt(dateParts[0]);
                                            const day = parseInt(dateParts[1]);
                                            const year = parseInt(dateParts[2]);
                                            
                                            let hour = 0;
                                            let minute = 0;
                                            
                                            if (timePart) {
                                                const timeParts = timePart.split(':');
                                                if (timeParts.length === 2) {
                                                    hour = parseInt(timeParts[0]);
                                                    minute = parseInt(timeParts[1]);
                                                }
                                            }
                                            
                                            // Create date, assuming it's in PST
                                            date = new Date(year, month - 1, day, hour, minute);
                                        } else {
                                            // Try to parse as ISO string or other format
                                            date = new Date(timestamp);
                                        }
                                    } else {
                                        // Try to parse as ISO string or other format
                                        try {
                                            date = new Date(timestamp);
                                        } catch (e) {
                                            return 'Timestamp: ' + timestamp;
                                        }
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
// Apply zoom state if we have one
if (savedState && charts[chartId]) {
    try {
        const newDataLength = charts[chartId].data.labels.length;
        const oldDataLength = savedState.dataLength;
        
        // Calculate how many new data points were added
        const newPoints = Math.max(0, newDataLength - oldDataLength);
        
        // Only apply zoom state if there was one before
        if (savedState.xMin !== undefined && savedState.xMax !== undefined) {
            if (newPoints > 0) {
                // Always show the latest data point (at the new max index)
                // but keep the same min point we were looking at before
                let newMin = savedState.xMin;
                let newMax = newDataLength - 1; // Always show the last (latest) data point
                
                console.log(`Auto-zooming chart ${chartId}: min=${newMin}, max=${newMax}, added ${newPoints} new points`);
                
                // Apply the X-axis zoom state
                charts[chartId].options.scales.x.min = newMin;
                charts[chartId].options.scales.x.max = newMax;
                
                // Check if the newest data points fall outside the current Y-axis range
                // and adjust if necessary
                if (savedState.y1Min !== undefined && savedState.y1Max !== undefined) {
                    // Get current shared y-axis limits (both axes use the same scale)
                    let yMin = Math.min(savedState.y1Min, savedState.y2Min);
                    let yMax = Math.max(savedState.y1Max, savedState.y2Max);
                    let needsAdjustment = false;
                    
                    // Check each new data point to see if it's outside current range
                    for (let i = oldDataLength; i < newDataLength; i++) {
                        // Check all datasets (index 0, 1, and 2)
                        for (let datasetIndex = 0; datasetIndex < charts[chartId].data.datasets.length; datasetIndex++) {
                            const value = charts[chartId].data.datasets[datasetIndex].data[i];
                            if (value !== null && value !== undefined && !isNaN(value)) {
                                // Check if value is outside the current range
                                if (value < yMin || value > yMax) {
                                    needsAdjustment = true;
                                    
                                    // Add a small padding (5% of the range) for better visibility
                                    const padding = (yMax - yMin) * 0.05;
                                    
                                    if (value < yMin) {
                                        yMin = Math.min(yMin, value - padding);
                                    }
                                    if (value > yMax) {
                                        yMax = Math.max(yMax, value + padding);
                                    }
                                }
                            }
                        }
                    }
                    
                    // Apply adjusted Y-axis settings to both axes
                    if (needsAdjustment) {
                        charts[chartId].options.scales.y1.min = yMin;
                        charts[chartId].options.scales.y1.max = yMax;
                        charts[chartId].options.scales.y2.min = yMin;
                        charts[chartId].options.scales.y2.max = yMax;
                        
                        console.log(`Adjusted both Y scales for new data points: (${yMin}, ${yMax})`);
                    } else {
                        // If no adjustment needed, keep the previous values
                        charts[chartId].options.scales.y1.min = savedState.y1Min;
                        charts[chartId].options.scales.y1.max = savedState.y1Max;
                        charts[chartId].options.scales.y2.min = savedState.y2Min;
                        charts[chartId].options.scales.y2.max = savedState.y2Max;
                        
                        console.log(`No Y-axis adjustment needed for new data points`);
                    }
                }
            } else {
                // If no new points added, restore the exact same view as before
                charts[chartId].options.scales.x.min = savedState.xMin;
                charts[chartId].options.scales.x.max = savedState.xMax;
                
                console.log(`Restoring exact X zoom for ${chartId}: min=${savedState.xMin}, max=${savedState.xMax}`);
                
                // Restore Y-axis zoom state if it exists
                if (savedState.y1Min !== undefined && savedState.y1Max !== undefined) {
                    charts[chartId].options.scales.y1.min = savedState.y1Min;
                    charts[chartId].options.scales.y1.max = savedState.y1Max;
                    charts[chartId].options.scales.y2.min = savedState.y2Min;
                    charts[chartId].options.scales.y2.max = savedState.y2Max;
                    console.log(`Restoring Y axes zoom for ${chartId}`);
                }
            }
        }
        
        // Update the chart with the saved zoom state
        charts[chartId].update();
    } catch (error) {
        console.error("Error restoring zoom state for " + chartId + ":", error);
    }
}
    } // End of for-loop for chart creation
    
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
    
    // Restore positions immediately (no delay to avoid flash)
    console.log("Charts rendered, restoring positions - Window:", savedScrollPosition, 
               "Sidebar:", savedSidebarPosition,
               "Main Content:", savedMainContentPosition);
    
    // Immediate fix
    fixScroll();
    
    // Set up a sequence of restoration attempts for reliability
    setTimeout(fixScroll, 50);
    setTimeout(fixScroll, 100);
    setTimeout(fixScroll, 300);
    setTimeout(fixScroll, 500);
    setTimeout(fixScroll, 1000);
} // End of fetchDataAndUpdateCharts function

// Initial load
window.addEventListener('load', () => {
    console.log("Window loaded, initial scroll position:", window.scrollY);
    
    // Identify scrollable containers
    identifyScrollableContainers();
    
    // Force a scroll position read and save
    savedScrollPosition = window.scrollY || document.documentElement.scrollTop || 0;
    localStorage.setItem('savedScrollPosition', String(savedScrollPosition));
    
    // Also check for main content container scroll
    if (mainContentContainer) {
        savedMainContentPosition = mainContentContainer.scrollTop || 0;
        localStorage.setItem('mainContentScrollPosition', String(savedMainContentPosition));
    }
    
    // Also check for sidebar scroll
    if (sidebarContainer) {
        savedSidebarPosition = sidebarContainer.scrollTop || 0;
        localStorage.setItem('sidebarScrollPosition', String(savedSidebarPosition));
    }
    
    console.log("Initial positions saved - Main:", savedScrollPosition, "Sidebar:", savedSidebarPosition, "Main Content:", savedMainContentPosition);
    
    fetchDataAndUpdateCharts();
    setupAutoRefresh();
});

// Function to set up automatic refresh
function setupAutoRefresh() {
    // Only set up a new timer if one isn't already running
    if (!refreshTimer) {
        // Log when the next refresh attempt will be
        const nextRefreshTime = new Date(Date.now() + 240000); // 4 minutes from now
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
            const isWeekday = dayOfWeek >= 0 && dayOfWeek <= 7;
            
            // Get minutes for checking time boundaries
            const estMinutes = now.getUTCMinutes();
            
            // Check if current time is between 9:30 AM and 16:10 (4:10 PM) EST
            const isMarketHours = isWeekday && 
                                 (((estHours === 9 && estMinutes >= 30) || // 9:30 AM or later
                                   (estHours > 9 && estHours < 16)) ||     // 10 AM to 3:59 PM
                                  (estHours === 16 && estMinutes <= 10));  // Up to 4:10 PM
            
            if (isMarketHours) {
                console.log("Auto-refreshing at:", new Date().toLocaleTimeString());
                fetchDataAndUpdateCharts();
            } else {
                console.log("Outside market hours, skipping refresh at:", new Date().toLocaleTimeString());
                //fetchDataAndUpdateCharts(); // Always refresh for testing purposes
            }
            
            // Log when the next refresh attempt will be
            const nextRefreshTime = new Date(Date.now() + 240000); // 4 minutes from now
            console.log("Next refresh attempt will be at:", nextRefreshTime.toLocaleTimeString());
        }, 240000); // Check every 5 minutes (300000ms)
    }
}
		
		