nPages = 10;

for (var i = 0; i < nPages; i++) {
  if (i > 0) {
    window.open("http://localhost:3000/performancePage"+i, "_blank")
  }
  else {
    window.open("http://localhost:3000/performancePage", "_blank")
  }
}
