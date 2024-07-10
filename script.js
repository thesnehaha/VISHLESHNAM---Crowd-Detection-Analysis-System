document.addEventListener('DOMContentLoaded', function () {
    let frame = 0;
    let maxFrame = 0;  // Variable to store the maximum frame dynamically

    const frameStep = 1;  // Increment frame by 60 seconds
    const updateInterval = 5000;  // Update interval in milliseconds

    // Create Headcount Line Chart
    const ctxHeadCount = document.getElementById('headCountChart').getContext('2d');
    const headCountChart = new Chart(ctxHeadCount, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Head Count',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Head Count'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time Frame (sec)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `${tooltipItem.label}: ${tooltipItem.raw}`;
                        }
                    }
                }
            }
        }
    });

    const ctxAge = document.getElementById('ageChart').getContext('2d');
    const ageChart = new Chart(ctxAge, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Age Distribution',
                data: [],
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Age'
                    }
                }
            }
        }
    });

    const ctxGender = document.getElementById('genderChart').getContext('2d');
    const genderChart = new Chart(ctxGender, {
        type: 'pie', // Change chart type to 'pie'
        data: {
            labels: ['Male', 'Female'],
            datasets: [{
                label: 'Gender Distribution',
                data: [0, 0], // Initialize with 0 counts for Male and Female
                backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(255, 99, 132, 0.2)'],
                borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom', // Set legend position
                    labels: {
                        boxWidth: 20, // Adjust the legend box width
                        usePointStyle: true, // Use point style for legend icons
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `${tooltipItem.label}: ${tooltipItem.raw}`;
                        }
                    }
                }
            }
        }
    });

    // Function to fetch maximum frame from PHP or database
    function fetchMaxFrame() {
        fetch('fetch_max_frame.php')
            .then(response => response.json())
            .then(data => {
                maxFrame = data.maxFrame;
                console.log(`Max Frame: ${maxFrame}`);
                // Start fetching data after getting maxFrame
                setInterval(fetchDataAndUpdateCharts, updateInterval);
            })
            .catch(error => console.error('Error fetching max frame:', error));
    }

    // Fetch the maximum frame before starting dynamic updates
    fetchMaxFrame();

    function fetchDataAndUpdateCharts() {
        fetch(`fetch_data.php?frame=${frame}`)
            .then(response => response.json())
            .then(data => {
                const ageLabels = data.age.labels;
                const ageCounts = data.age.data;
                const genderCounts = data.gender.data;
                const headCountLabels = data.headcount.labels;
                const headCountData = data.headcount.data;

                // Update age chart data
                ageChart.data.labels = ageLabels;
                ageChart.data.datasets[0].data = ageCounts;

                // Update gender chart data
                genderChart.data.datasets[0].data = genderCounts;

                // Update head count chart data
                headCountChart.data.labels = headCountLabels;
                headCountChart.data.datasets[0].data = headCountData;

                // Update all charts
                ageChart.update();
                genderChart.update();
                headCountChart.update();

                // Update the time frame display above age chart
                document.getElementById('timeFrameAge').innerText = `Current Time Frame: ${frame} sec`;

                // Update the time frame display above gender chart
                document.getElementById('timeFrameGender').innerText = `Current Time Frame: ${frame} sec`;

                // Update the time frame display above head count chart
                document.getElementById('timeFrameHeadCount').innerText = `Current Time Frame: ${frame} sec`;

                // Increment frame
                frame += frameStep;

                // Reset frame if it exceeds maxFrame
                if (frame > maxFrame) {
                    frame = 0;
                }
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    // Initial fetch and chart update
    fetchDataAndUpdateCharts();

    // Functions for showing sections and handling popups
    function showSection(sectionId) {
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(sectionId).style.display = 'block';
    }

    function openPopup(popupId) {
        document.getElementById(popupId).style.display = 'flex';
    }

    function closePopup(popupId) {
        document.getElementById(popupId).style.display = 'none';
    }

    // Initialize by showing the home section
    showSection('home');

    // Expose the functions to the global scope
    window.showSection = showSection;
    window.openPopup = openPopup;
    window.closePopup = closePopup;
});
