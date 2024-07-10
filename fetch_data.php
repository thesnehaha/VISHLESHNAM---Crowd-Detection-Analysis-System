<?php
include 'db.php';

// Fetch frame from query parameter
$frame = isset($_GET['frame']) ? intval($_GET['frame']) : 0;

// Calculate frame range based on frame
$startFrame = $frame - 1;  // Last 1 second
$endFrame = $frame;

// Query to fetch age data based on frame range
$sqlAge = "SELECT Age, COUNT(Age) as count 
           FROM detections 
           WHERE frame >= $startFrame AND frame <= $endFrame 
           GROUP BY Age
           ORDER BY FIELD(Age, '(0-1)', '(2-4)', '(4-6)', '(8-12)', '(15-20)', '(25-32)', '(38-43)', '(48-53)', '(60-100)')";

$resultAge = $conn->query($sqlAge);

$ageLabels = [];
$ageCounts = [];

if ($resultAge->num_rows > 0) {
    while ($row = $resultAge->fetch_assoc()) {
        $ageLabels[] = $row["Age"];
        $ageCounts[] = $row["count"];
    }
}

// Query to fetch gender data based on frame range
$sqlGender = "SELECT Gender, COUNT(Gender) as count 
              FROM detections 
              WHERE frame >= $startFrame AND frame <= $endFrame 
              GROUP BY Gender";

$resultGender = $conn->query($sqlGender);

$genderLabels = ['Male', 'Female'];
$genderCounts = [0, 0];  // Initialize counts for Male and Female

if ($resultGender->num_rows > 0) {
    while ($row = $resultGender->fetch_assoc()) {
        if ($row["Gender"] === 'Male') {
            $genderCounts[0] = $row["count"];
        } elseif ($row["Gender"] === 'Female') {
            $genderCounts[1] = $row["count"];
        }
    }
}

// Query to fetch headcount data based on frame range
$sqlHeadCount = "SELECT frame, COUNT(*) as headcount 
                 FROM detections 
                 WHERE frame >= $startFrame AND frame <= $endFrame 
                 GROUP BY frame";

$resultHeadCount = $conn->query($sqlHeadCount);

$headCountLabels = [];
$headCountData = [];

if ($resultHeadCount->num_rows > 0) {
    while ($row = $resultHeadCount->fetch_assoc()) {
        $headCountLabels[] = $row["frame"];
        $headCountData[] = $row["headcount"];
    }
}

// Prepare JSON response
$data = array(
    "age" => array(
        "labels" => $ageLabels,
        "data" => $ageCounts
    ),
    "gender" => array(
        "labels" => $genderLabels,
        "data" => $genderCounts
    ),
    "headcount" => array(
        "labels" => $headCountLabels,
        "data" => $headCountData
    )
);

// Send JSON response
echo json_encode($data);
?>