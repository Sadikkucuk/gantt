function parseCSV(text) {
  const rows = text.split(/\r?\n/).filter(r => r.trim());
  if (rows.length < 2) return [];

  const headers = rows.shift().split(",");

  const tasks = [];
  const stack = {};

  rows.forEach(row => {
    const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const d = {};
    headers.forEach((h, i) => d[h.trim()] = (cols[i] || "").replace(/"/g, "").trim());

    const level = parseInt(d["Outline Level"] || "1", 10);
    const id = parseInt(d["ID"], 10);
    if (!id || !d["Start"] || !d["Finish"]) return;

    let parentId = null;
    if (level > 1 && stack[level - 1]) parentId = stack[level - 1];
    stack[level] = id;

    tasks.push({
      id,
      name: d["Name"] || "Unnamed task",
      start: d["Start"],
      end: d["Finish"],
      level,
      parentId,
      progress: parseInt(d["% Complete"] || "0", 10),
      type: d["Start"] === d["Finish"] ? "milestone" : "task"
    });
  });

  return tasks;
}
