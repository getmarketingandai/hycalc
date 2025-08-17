document.addEventListener('DOMContentLoaded', function () {
    // Wait for all resources to load
    window.addEventListener('load', function() {
        fixBarChart();
    });
    
    // Also try fixing after a short delay to ensure DOM is fully processed
    setTimeout(fixBarChart, 1000);
    
    function fixBarChart() {
        const barChartCanvas = document.getElementById('barChart');
        const barChartWrapper = document.getElementById('barChart-wrapper');
        
        if (!barChartCanvas || !barChartWrapper) {
            console.error("Bar chart elements not found");
            return;
        }
        
        // Remove any duplicate headers that might be causing layout issues
        const extraHeaders = barChartWrapper.querySelectorAll('.subheading + div h2, .subheading + div h3');
        extraHeaders.forEach(header => {
            if (header.textContent.includes('Investment Performance')) {
                header.parentElement.remove();
            }
        });
        
        // Fix container sizes
        barChartWrapper.style.height = 'auto';
        barChartWrapper.style.minHeight = '450px'; // Extra space for the full chart
        barChartWrapper.style.paddingBottom = '30px'; // Add bottom padding
        
        // Fix canvas element
        barChartCanvas.style.height = '400px';
        barChartCanvas.style.maxHeight = 'none';
        barChartCanvas.style.width = '100%';
        barChartCanvas.style.display = 'block';
        
        // If the chart already exists, resize it
        if (window.myChart) {
            try {
                window.myChart.resize();
                
                // Ensure full chart redraw with animation
                window.myChart.reset();
                window.myChart.update();
                
                console.log("Existing chart resized");
            } catch (e) {
                console.error("Error resizing chart:", e);
                // If resize fails, destroy and recreate
                window.myChart.destroy();
                createNewChart();
            }
        } else {
            createNewChart();
        }
    }
    
    function createNewChart() {
        const barChartCanvas = document.getElementById('barChart');
        const ctx = barChartCanvas.getContext('2d');
        
        const benchmarks = {
            SPY: 0.115,
            VNQ: 0.068,
            VCIT: 0.039
        };
        
        let invProp = window.financialOutputs?.IRR || 0;
        
        window.myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['S&P 500', 'RE ETF', 'Bond ETF', 'Your Property'],
                datasets: [{
                    label: 'Returns',
                    backgroundColor: [
                        'rgba(255, 209, 81, 0.6)',
                        'rgba(0, 0, 0, 0.6)',
                        'rgba(164, 164, 164, 0.6)',
                        'rgba(122, 223, 187, 0.6)'
                    ],
                    data: [benchmarks.SPY, benchmarks.VNQ, benchmarks.VCIT, invProp],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        bottom: 20 // Add padding to ensure nothing gets cut off
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: false // No title - it's in the HTML already
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return (context.raw * 100).toFixed(1) + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return (value * 100).toFixed(0) + '%';
                            }
                        },
                        max: Math.max(
                            Math.ceil(Math.max(invProp, benchmarks.SPY) * 20) / 20 + 0.03,
                            0.17 // Ensure we show at least up to 17%
                        )
                    }
                }
            },
            plugins: [{
                afterDraw: function (chart) {
                    const ctx = chart.ctx;
                    chart.data.datasets.forEach(function (dataset, i) {
                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach(function (bar, index) {
                            const value = dataset.data[index];
                            const text = (value * 100).toFixed(1) + '%';
                            ctx.fillStyle = '#000';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            ctx.font = 'bold 12px Arial';
                            ctx.fillText(text, bar.x, bar.y - 5);
                        });
                    });
                }
            }]
        });
        
        console.log("New chart created");
    }
    
    // Listen for form dictionary changes
    document.addEventListener('formDictionaryChanged', function () {
        if (window.myChart && window.financialOutputs) {
            const newInvProp = window.financialOutputs.IRR || 0;
            window.myChart.data.datasets[0].data[3] = newInvProp;
            window.myChart.update();
            
            // Attempt to fix any rendering issues after update
            setTimeout(fixBarChart, 200);
        }
    });
    
    // Also handle window resize events
    window.addEventListener('resize', function() {
        setTimeout(fixBarChart, 200);
    });
});