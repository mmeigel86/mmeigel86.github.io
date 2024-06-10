import { solve, solvePoints } from "./index.js";
const toRad = Math.PI / 180.0;
const toDeg = 180.0 / Math.PI;

function conversionObject(width, height, points) {
    const xvals = [];
    const yvals = [];
    for (let p of points) {
        xvals.push(p[0]);
        yvals.push(p[1]);
    }
    const xmin = Math.min(...xvals);
    const xmax = Math.max(...xvals);
    const ymin = Math.min(...yvals);
    const ymax = Math.max(...yvals);
    const xwidth = xmax - xmin;
    const yheight = ymax - ymin;
    const xzoom = width / xwidth;//higher if xwidth is smaller
    const yzoom = height / yheight;
    const zoom = Math.min(xzoom, yzoom);
    return { zoom, xmin, ymin, width, height, xpad: (width - zoom * xwidth) / 2, ypad: (height - zoom * yheight) / 2 };
}

function convertCoordinate(point, conv) {
    point[0] = (point[0] - conv.xmin) * conv.zoom + conv.xpad;
    point[1] = conv.height - conv.zoom * (point[1] - conv.ymin) - conv.ypad;
    return point;
}

function createCrossPath(point) {
    const crossSize = 5;
    const pathString = `M${point[0] - crossSize} ${point[1] - crossSize} L${point[0] + crossSize} ${point[1] + crossSize}`
        + ` M${point[0] - crossSize} ${point[1] + crossSize} L${point[0] + crossSize} ${point[1] - crossSize}`;
    const pathElem = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElem.setAttribute("d", pathString);
    return pathElem;
}

function createCircle(center, radius) {
    const circleElem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circleElem.setAttribute("cx", center[0]);
    circleElem.setAttribute("cy", center[1]);
    circleElem.setAttribute("r", radius);
    return circleElem;
}

export function createCheckboxListener(checkboxName, className) {
    return function () {
        const checkbox = document.querySelector("#" + checkboxName);
        const classToogle = document.querySelectorAll("." + className);
        if (!checkbox.checked) {
            for (let e of classToogle) {
                e.classList.add("invisible");
            }
        } else {
            for (let e of classToogle) {
                e.classList.remove("invisible");
            }
        }
    }
}

function callCheckboxListeners() {
    const elem = Array.from(document.querySelectorAll("input[type=checkbox]"));
    for (let e of elem) {
        e.dispatchEvent(new Event("click"));
    }
}

export function solveDemo() {
    const inputParameters = {};
    const inputs = Array.from(document.querySelectorAll("input"));
    for (let i of inputs) {
        if (i.value !== "") {
            inputParameters[i.id] = i.value;
        }
    }
    const tri = solve(inputParameters);
    document.querySelector("#output").textContent = JSON.stringify(tri, null, 4);

    /* svg output */
    const svg = document.querySelector("#svg-output");
    const delPaths = Array.from(svg.querySelectorAll("*"));
    for (let p of delPaths) {
        svg.removeChild(p);
    }
    if (tri.solutions.length >= 1) {
        const sol = tri.solutions[0];
        const convAngles = tri.mode == "deg" ? toRad : 1;
        let points = [[0, 0], [sol.c, 0], [Math.cos(sol.alpha * convAngles) * sol.b, Math.sin(sol.alpha * convAngles) * sol.b]]
        const conv = conversionObject(svg.width.baseVal.value, svg.height.baseVal.value, points);
        const pointSol = solvePoints(...points).solutions[0];
        points.push([pointSol.incircle.center.x, pointSol.incircle.center.y]);
        points.push([pointSol.circumcircle.center.x, pointSol.circumcircle.center.y]);
        points = points.map(p => convertCoordinate(p, conv));

        const newPath = `M${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]} L${points[2][0]} ${points[2][1]} Z`;
        const pathElem = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElem.setAttribute("d", newPath);
        svg.append(pathElem);

        /* incircle */
        const incircCircle = createCircle(points[3], sol.incircle.radius * conv.zoom);
        incircCircle.classList.add("incircle");
        svg.append(incircCircle);

        /* circumcircle */
        const circumCircle = createCircle(points[4], sol.circumcircle.radius * conv.zoom);
        circumCircle.classList.add("circumcircle");
        svg.append(circumCircle);
        /* making sure centroid/circles are drawn or not drawn */
        callCheckboxListeners();
    }
}

export function solvePointsDemo() {
    const param = { A: {}, B: {}, C: {} };
    const inputs = Array.from(document.querySelectorAll(".input-solvePoint"));
    for (let i of inputs) {
        if (i.id == "mode" && i.value !== "") {
            param.mode = i.value;
            continue;
        }
        if (i.value !== "") {
            param[i.id[0].toUpperCase()][i.id[1]] = i.value;
        }
    }
    const tri = solvePoints(param.A, param.B, param.C, param.mode);
    document.querySelector("#output").textContent = JSON.stringify(tri, null, 4);

    /* svg output */
    const svg = document.querySelector("#svg-output");
    const delPaths = Array.from(svg.querySelectorAll("*"));
    for (let p of delPaths) {
        svg.removeChild(p);
    }
    if (tri.solutions.length >= 1) {
        const sol = tri.solutions[0];
        let points = [[tri.A.x, tri.A.y], [tri.B.x, tri.B.y], [tri.C.x, tri.C.y],
        [sol.centroid.x, sol.centroid.y], [sol.incircle.center.x, sol.incircle.center.y], [sol.circumcircle.center.x, sol.circumcircle.center.y]];
        const conv = conversionObject(svg.width.baseVal.value, svg.height.baseVal.value, points.slice(0, 3));//only vertices
        points = points.map(p => convertCoordinate(p, conv));

        /* triangle */
        const newPath = `M${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]} L${points[2][0]} ${points[2][1]} Z`;
        const pathElem = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElem.setAttribute("d", newPath);
        svg.append(pathElem);
        /* centroid */
        const centroidElem = createCrossPath(points[3]);
        centroidElem.classList.add("centroid");
        svg.append(centroidElem);
        /* incircle */
        const incircCenter = createCrossPath(points[4]);
        incircCenter.classList.add("incircle");
        svg.append(incircCenter);
        const incircCircle = createCircle(points[4], sol.incircle.radius * conv.zoom);
        incircCircle.classList.add("incircle");
        svg.append(incircCircle);

        /* circumcircle */
        const circumElem = createCrossPath(points[5]);
        circumElem.classList.add("circumcircle");
        svg.append(circumElem);
        const circumCircle = createCircle(points[5], sol.circumcircle.radius * conv.zoom);
        circumCircle.classList.add("circumcircle");
        svg.append(circumCircle);
        /* making sure centroid/circles are drawn or not drawn */
        callCheckboxListeners();

        /* labeling vertices */
        const labels = ["A", "B", "C"];
        for (let i = 0; i < 3; i++) {
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", points[i][0]);
            text.setAttribute("y", points[i][1]);
            text.textContent = labels[i];
            svg.append(text);
        }
    }
}