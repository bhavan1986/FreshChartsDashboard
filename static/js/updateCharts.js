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
                            autoSkip: false
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