// studentInfoApp.js

// Import required modules
const readline = require('readline');
const { DateTime } = require('luxon'); // For date/time formatting

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to calculate age
function calculateAge(dob) {
  const birthDate = DateTime.fromISO(dob);
  const now = DateTime.now();
  return now.diff(birthDate, 'years').years.toFixed(0);
}

// Function to calculate percentage and grade
function calculateGrade(marks, totalMarks) {
  const percentage = (marks / totalMarks) * 100;
  let grade = '';

  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 75) grade = 'A';
  else if (percentage >= 60) grade = 'B';
  else if (percentage >= 45) grade = 'C';
  else grade = 'F';

  return { percentage: percentage.toFixed(2), grade };
}

// Display student info
function displayStudentInfo(name, dob, marks, totalMarks) {
  const age = calculateAge(dob);
  const { percentage, grade } = calculateGrade(marks, totalMarks);
  const currentDateTime = DateTime.now().toLocaleString(DateTime.DATETIME_MED);

  console.log("\n========================");
  console.log("Student Information");
  console.log("========================");
  console.log(`Name: ${name}`);
  console.log(`Date of Birth: ${dob}`);
  console.log(`Age: ${age} years`);
  console.log(`Marks: ${marks}/${totalMarks}`);
  console.log(`Percentage: ${percentage}%`);
  console.log(`Grade: ${grade}`);
  console.log(`Current Date/Time: ${currentDateTime}`);
  console.log("========================\n");
}

// Collect input from user
rl.question("Enter student name: ", (name) => {
  rl.question("Enter date of birth (YYYY-MM-DD): ", (dob) => {
    rl.question("Enter marks obtained: ", (marks) => {
      rl.question("Enter total marks: ", (totalMarks) => {
        displayStudentInfo(name, dob, parseFloat(marks), parseFloat(totalMarks));
        rl.close();
      });
    });
  });
});
