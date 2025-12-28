function parseCSV(text) {
  const rows = text.split("\n").filter(r => r.trim());
  const headers = rows.shift().split(",");

  const stack = {};
  const tasks = [];

  rows.forEach(row => {
    const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const d = {};
    headers.forEach((h, i) => d[h.trim()] = cols[i]?.replace(/"/g, "").trim());

    const level = parseInt(d["Outline Level"]);
    const id = parseInt(d["ID"]);

    let parentId = null;
    if (level > 1 && stack[level - 1]) parentId = stack[level - 1];
    stack[level] = id;

    tasks.push({
      id,
      name: d["Name"],
      start: d["Start"],
      end: d["Finish"],
      level,
      parentId,
      progress: parseInt(d["% Complete"] || "0"),
      type: d["Start"] === d["Finish"] ? "milestone" : "task"
    });
  });

  return tasks;
}
