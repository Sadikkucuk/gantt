function parseCSV(text) {
  const rows = text.split("\n").filter(Boolean);
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

    const deps = [];
    if (d["Predecessors"]) {
      const m = d["Predecessors"].match(/(\d+)(FS|SS|FF|SF)/);
      if (m) deps.push({ taskId: +m[1], type: m[2] });
    }

    tasks.push({
      id,
      name: d["Name"],
      start: d["Start"],
      end: d["Finish"],
      level,
      parentId,
      progress: +d["% Complete"] || 0,
      dependencies: deps,
      color: d["Color"] ? `#${d["Color"]}` : null,
      type: d["Start"] === d["Finish"] ? "milestone" : (level === 1 ? "project" : "task")
    });
  });

  return tasks;
}
