<?php
include 'db.php';

$sql = "SELECT MAX(frame) AS maxFrame FROM people_detection";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $maxFrame = intval($row['maxFrame']);
} else {
    $maxFrame = 0;  // Default to 0 if no data found
}

$data = array(
    "maxFrame" => $maxFrame
);

header('Content-Type: application/json');
echo json_encode($data);
?>