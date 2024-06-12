/**
 * @author Michael Meigel 
 * 
 */

/* Constants for angle mode conversions*/
const toRad = Math.PI / 180.0;
const toDeg = 180.0 / Math.PI;
/* Sum of angle values in radians (equal to 180 degrees) */
const angleSum = Math.PI;
/* Order of side lengths/angles in valArrays */
const order = ["a", "gamma", "b", "alpha", "c", "beta"];

/**
 * Rounds the fractional part of a floating point number to a given precision. 
 * @param {number} value 
 * @param {number} precision maximum amount of post decimal point digits.
 * @returns 
 */
export function roundToPrecision(value, precision) {
    if (precision < 0) {
        return value;
    }
    precision = Math.floor(precision);//digits must be integer
    const mul = 10 ** precision;
    return (Math.round(value * mul) / mul);
}

/**
 * Checks equality of two floating point numbers. Returns true if |f1-f2| <= maxDifference.
 * @param {number} f1 First number
 * @param {number} - f2 Second Number
 * @param {number} [maxDifference=0.001] - Maximum 
 * @returns {boolean} 
 */
function equalFloat(f1, f2, maxDifference = 0.001) {
    return Math.abs(f1 - f2) <= maxDifference;
}

/**
 * Creates solution object, also checks if there is a mismatch between calculated and input values if more than 3 values where provided 
 * @param {Array} valArray
 * @param {Object} result
 * @param {number} parameterCount Number of side lengths/angles that were 
 * @returns 
 */
function addSolutionToResult(valArray, result, parameterCount = 3) {
    /* Convert angles back to degrees if necessary */
    const modeOutConv = result.mode === "deg" ? toDeg : 1;
    /* Check if given and calculated values are in conflict, can only happen if more than 3 were given */
    if (parameterCount > 3) {
        for (let i = 0; i < order.length; i++) {
            const property = order[i];
            const calculatedValue = i % 2 == 1 ? modeOutConv * valArray[i] : valArray[i];
            if (result[property]) {
                if (!equalFloat(result[property], calculatedValue)) {
                    result.error = `Calculated value for "${property}" different from input: input: ${result[property]} calculated: ${calculatedValue}`;
                    return result;
                }
            }
        }
    }
    /* Check if triangle is valid */
    /* Angles */
    if ([valArray[1], valArray[3], valArray[5]].some((x) => { return (x <= 0 || x >= angleSum) })) {
        result.error = `Unsolvable: No solution is possible for given parameters.`;
        return result;
    }
    /* Side lengths */
    if ([valArray[0], valArray[2], valArray[4]].some((x) => { return (x <= 0) })) {
        result.error = `Unsolvable: No solution is possible for given parameters.`;
        return result;
    }

    /* Create solution object and add to result object*/
    const solution = {};
    for (let i = 0; i < order.length; i += 2) {
        solution[order[i]] = valArray[i];
    }
    for (let i = 1; i < order.length; i += 2) {
        solution[order[i]] = modeOutConv * valArray[i];
    }
    solution.area = 0.5 * valArray[0] * valArray[2] * Math.sin(valArray[1]);

    solution.incircle = {
        radius: incircleRadius(valArray[0], valArray[2], valArray[4])
    };

    solution.circumcircle = {
        radius: (valArray[0] / Math.sin(valArray[3])) / 2
    };
    solution.ha = (solution.b * solution.c) / (2 * solution.circumcircle.radius);
    solution.hb = (solution.a * solution.c) / (2 * solution.circumcircle.radius);
    solution.hc = (solution.a * solution.b) / (2 * solution.circumcircle.radius);

    result.solutions.push(solution);
    return result;
}

/**
 * @typedef {Object} Circle
 * @property {number} radius - Radius of circle
 * @property {Point} [center] - Coordinate of Center. Only calculated by {@link solvePoints}
 */

/**
 * Incomplete triangle, consisting of several side lengths and angle values.
 * @typedef {Object} triangleToSolve
 * @property {!number} [a] - Length of side a
 * @property {!number} [b] - Length of side b
 * @property {!number} [c] - Length of side c
 * @property {!number} [alpha] - Angle opposite of side a
 * @property {!number} [beta] - Angle opposite of side b
 * @property {!number} [gamma] - Angle opposite of side c
 * @property {string} [mode="deg"] - Specifies if angles are in degrees or radians
 */

/**
 * Complete triangle, consisting of all side lengths and angle values.
 * @typedef {Object} triangleSolution
 * @property {number} a - Length of side a
 * @property {number} b - Length of side b
 * @property {number} c - Length of side c
 * @property {number} alpha - Angle opposite of side a
 * @property {number} beta - Angle opposite of side b
 * @property {number} gamma - Angle opposite of side c
 * @property {number} area - The area of the triangle
 * @property {Circle} incircle - Inscribed circle of the the triangle (largest circle that fits inside triangle)
 * @property {Circle} circumcircle - Circumscribed circle of the the triangle (smallest Circle that passes through all vertices)
 * @property {Point} [centroid] - Geometric center of the triangle. Only calculated by {@link solvePoints}
 * 
*/

/**
 * Result Object. 
 * Contains solutions for triangle, original parameters and, if no solution could be found, an error message.
 * @typedef {Object} solveResult
 * @property {Array.<triangleSolution>} a - Array of possible solutions
 * @property {string} mode - Specifies if angles are in degrees or radians
 * @property {?string} error - If no solution could be found this string explains the reason
*/

/**
 * Finds missing side lengths and angles of incomplete triangle definition. 
 * There can be 0, 1 or 2 possible solutions. 
 * Input Object must contain a minimum of 3 side length/angles, at least one of which must be a side length.
 * @example
 * let solved = solve({a:1, b:2, gamma:30, mode:"deg"});
 * @param {triangleToSolve} triangleToSolve 
 * @returns {solveResult} 
 */
export function solve({ a, b, c, alpha, beta, gamma, mode = "deg" }) {
    const result = { a, b, c, alpha, beta, gamma, mode, solutions: [] };
    /* Remove undefined parameters */
    Object.keys(result).forEach(
        (p) => {
            if (result[p] === undefined || result[p] === "") {
                delete result[p];
            }
        });
    /* Array which holds given and calculated values. */
    const valArray = [result.a, result.gamma, result.b, result.alpha, result.c, result.beta];
    /* Amount of given sidelengths/angles, used for finding solving strategy */
    let sideCount = 0;
    let angleCount = 0;
    /* Index of first side length/angle in valArray, used for finding solving strategy */
    let firstSide = -1;
    let firstAngle = -1;

    /* Setting angle mode, angles in degrees are converted to radian*/
    let modeInConv;
    if (mode !== "deg" && mode !== "rad") {
        result.error = `Unknown mode: ${mode} - Must be "deg" or "rad"`
        return result;
    }
    modeInConv = mode === "deg" ? toRad : 1;

    /* Validation and analysis of input parameters, also conversion of angle values */
    for (let i = 0; i < valArray.length; i += 2) {
        if (typeof valArray[i] == "undefined") {
            continue;
        }
        const num = Number(valArray[i]);
        if (Number.isNaN(num) || num <= 0) {
            result.error = `Illegal value: ${order[i]} = ${valArray[i]} - All side lengths must be numbers >0`;
            return result;
        }
        valArray[i] = num;
        if (firstSide < 0) {
            firstSide = i;
        }
        sideCount++;
    }

    for (let i = 1; i < valArray.length; i += 2) {
        if (typeof valArray[i] == "undefined") {
            continue;
        }
        const num = Number(valArray[i]) * modeInConv;
        if (Number.isNaN(num) || num <= 0 || num >= angleSum) {
            result.error = `Illegal value: ${order[i]} = ${valArray[i]} - All angle values must be numbers >0 and <180(deg) | <Pi*2(rad)`;
            return result;
        }
        valArray[i] = num;
        if (firstAngle < 0) {
            firstAngle = i;
        }
        angleCount++;
    }
    const parameterCount = angleCount + sideCount;

    //Too few parameters - impossible to solve
    if (parameterCount < 3) {
        result.error = `Unsolvable: At least 3 parameters must be given, inluding one side length.`
        return result;
    }

    //No side lengths - impossible to solve
    if (sideCount === 0) {
        result.error = `Unsolvable: At least one parameter must be a side length`
        return result;
    }

    /* Determining type of problem and solving */
    //SSS
    if (sideCount === 3) {
        //result.debug="SSS";
        valArray[3] = Math.acos((b ** 2 + c ** 2 - a ** 2) / (2 * b * c));
        valArray[5] = Math.acos((a ** 2 + c ** 2 - b ** 2) / (2 * a * c));
        valArray[1] = angleSum - valArray[3] - valArray[5];
        if (valArray.some(x => { return !x })) {
            result.error = `Unsolvable: Impossible combination of side lengths: ${[a, b, c].join(", ")}`;
            return result;
        }
        addSolutionToResult(valArray, result, parameterCount);
        return result;
    }

    //ASA
    if (valArray[(firstSide + 5) % 6] && valArray[(firstSide + 1) % 6]) {
        //result.debug="ASA";
        /* Missing Angle */
        const thirdAngleIndex = (firstSide + 3) % 6;
        valArray[thirdAngleIndex] = angleSum - valArray[(firstSide + 5) % 6] - valArray[(firstSide + 1) % 6];
        /* Missing Sides */
        valArray[(firstSide + 2) % 6] = valArray[firstSide] * (Math.sin(valArray[(firstSide + 5) % 6]) / Math.sin(valArray[thirdAngleIndex]));
        valArray[(firstSide + 4) % 6] = valArray[firstSide] * (Math.sin(valArray[(firstSide + 7) % 6]) / Math.sin(valArray[thirdAngleIndex]));

        addSolutionToResult(valArray, result, parameterCount);
        return result;
    }

    //SAS
    if (valArray[(firstAngle + 5) % 6] && valArray[(firstAngle + 1) % 6]) {
        //result.debug="SAS";
        /* Missing Sides */
        const side1 = valArray[(firstAngle + 5) % 6];
        const side2 = valArray[(firstAngle + 1) % 6];
        const side3 = Math.sqrt(side1 ** 2 + side2 ** 2 - 2 * side1 * side2 * Math.cos(valArray[firstAngle]));
        valArray[(firstAngle + 3) % 6] = side3;
        /* Missing Angles */
        valArray[(firstAngle + 2) % 6] = Math.acos((side3 ** 2 + side2 ** 2 - side1 ** 2) / (2 * side3 * side2));
        valArray[(firstAngle + 4) % 6] = angleSum - valArray[(firstAngle + 2) % 6] - valArray[firstAngle];

        addSolutionToResult(valArray, result, parameterCount);
        return result;
    }

    //SAA
    if (valArray[(firstSide + 1) % 6] && valArray[(firstSide + 3) % 6]) {
        //result.debug="SAA";
        /* Missing Angle */
        valArray[(firstSide + 5) % 6] = angleSum - valArray[(firstSide + 1) % 6] - valArray[(firstSide + 3) % 6];
        /* Missing Sides */
        valArray[(firstSide + 2) % 6] = valArray[firstSide] * (Math.sin(valArray[(firstSide + 5) % 6]) / Math.sin(valArray[(firstSide + 3) % 6]));
        valArray[(firstSide + 4) % 6] = valArray[firstSide] * (Math.sin(valArray[(firstSide + 7) % 6]) / Math.sin(valArray[(firstSide + 3) % 6]));


        addSolutionToResult(valArray, result, parameterCount);
        return result;
    }

    //AAS
    if (valArray[(firstSide + 5) % 6] && valArray[(firstSide + 3) % 6]) {
        //result.debug="ASS";
        /* Missing Angle */
        valArray[(firstSide + 1) % 6] = angleSum - valArray[(firstSide + 5) % 6] - valArray[(firstSide + 3) % 6];
        /* Missing Sides */
        valArray[(firstSide + 2) % 6] = valArray[firstSide] * (Math.sin(valArray[(firstSide + 5) % 6]) / Math.sin(valArray[(firstSide + 3) % 6]));
        valArray[(firstSide + 4) % 6] = valArray[firstSide] * (Math.sin(valArray[(firstSide + 7) % 6]) / Math.sin(valArray[(firstSide + 3) % 6]));

        addSolutionToResult(valArray, result, parameterCount);
        return result;
    }

    //SSA - if middle side is longer than outer side two solutions may exist
    if (valArray[(firstAngle + 5) % 6] && valArray[(firstAngle + 3) % 6]) {
        //result.debug="SSA";
        const s1 = valArray[(firstAngle + 3) % 6];
        const s2 = valArray[(firstAngle + 5) % 6];
        const angle = valArray[firstAngle];

        const D = (s2 / s1) * Math.sin(angle);
        if (D > 1) {
            result.error = `Unsolvable: No solution is possible for given parameters.`//`Unsolvable: Impossible combination of parameters: {${order[(firstAngle + 5) % 6]}:${valArray[(firstAngle + 5) % 6]}, ${order[(firstAngle + 3) % 6]}:${valArray[(firstAngle + 3) % 6]}, ${order[firstAngle]}:${valArray[firstAngle]}}`
            return result;
        }
        if (s1 >= s2) {
            /* Missing Angles */
            if (D == 1) {
                valArray[(firstAngle + 2) % 6] = Math.PI / 2;
            } else {
                valArray[(firstAngle + 2) % 6] = Math.asin(D);
            }
            valArray[(firstAngle + 4) % 6] = angleSum - angle - valArray[(firstAngle + 2) % 6];
            /* Missing Side */
            valArray[(firstAngle + 1) % 6] = s1 * (Math.sin(valArray[(firstAngle + 4) % 6]) / Math.sin(angle));

            addSolutionToResult(valArray, result, parameterCount);
        } else {
            const mysteryAngle = Math.asin(D);
            //First Solution
            /* Missing Angles */
            valArray[(firstAngle + 2) % 6] = mysteryAngle;
            valArray[(firstAngle + 4) % 6] = angleSum - angle - valArray[(firstAngle + 2) % 6];
            /* Missing Side */
            valArray[(firstAngle + 1) % 6] = s1 * (Math.sin(valArray[(firstAngle + 4) % 6]) / Math.sin(angle));

            addSolutionToResult(valArray, result, parameterCount);

            //Second Solution
            /* Missing Angles */
            valArray[(firstAngle + 2) % 6] = angleSum - mysteryAngle;
            valArray[(firstAngle + 4) % 6] = angleSum - angle - valArray[(firstAngle + 2) % 6];
            /* Missing Side */
            valArray[(firstAngle + 1) % 6] = s1 * (Math.sin(valArray[(firstAngle + 4) % 6]) / Math.sin(angle));

            addSolutionToResult(valArray, result, parameterCount);
        }
        return result;
    }

    //ASS - if middle side is longer than outer side two solutions may exist
    if (valArray[(firstAngle + 1) % 6] && valArray[(firstAngle + 3) % 6]) {
        //result.debug="ASS";
        const angle = valArray[firstAngle];
        const s1 = valArray[(firstAngle + 3) % 6];
        const s2 = valArray[(firstAngle + 1) % 6];
        /* Missing Angles */
        const D = (s2 / s1) * Math.sin(angle);
        if (D > 1) {
            result.error = `Unsolvable: No solution is possible for given parameters.`//`Unsolvable: Impossible combination of parameters: {${order[(firstAngle + 5) % 6]}:${valArray[(firstAngle + 5) % 6]}, ${order[(firstAngle + 3) % 6]}:${valArray[(firstAngle + 3) % 6]}, ${order[firstAngle]}:${valArray[firstAngle]}}`
            return result;
        }
        if (s1 >= s2) {
            /* Missing Angles */
            if (D == 1) {
                valArray[(firstAngle + 4) % 6] = Math.PI / 2;
            } else {
                valArray[(firstAngle + 4) % 6] = Math.asin(D);
            }
            valArray[(firstAngle + 2) % 6] = angleSum - angle - valArray[(firstAngle + 4) % 6];
            /* Missing Side */
            valArray[(firstAngle + 5) % 6] = s1 * (Math.sin(valArray[(firstAngle + 2) % 6]) / Math.sin(angle));

            addSolutionToResult(valArray, result, parameterCount);
        } else {
            const mysteryAngle = Math.asin(D);
            //First Solution
            /* Missing Angles */
            valArray[(firstAngle + 4) % 6] = mysteryAngle;
            valArray[(firstAngle + 2) % 6] = angleSum - angle - valArray[(firstAngle + 4) % 6];
            /* Missing Side */
            valArray[(firstAngle + 5) % 6] = s1 * (Math.sin(valArray[(firstAngle + 2) % 6]) / Math.sin(angle));

            addSolutionToResult(valArray, result, parameterCount);

            //Second Solution
            /* Missing Angles */
            valArray[(firstAngle + 4) % 6] = angleSum - mysteryAngle;
            valArray[(firstAngle + 2) % 6] = angleSum - angle - valArray[(firstAngle + 4) % 6];
            /* Missing Side */
            valArray[(firstAngle + 5) % 6] = s1 * (Math.sin(valArray[(firstAngle + 2) % 6]) / Math.sin(angle));

            addSolutionToResult(valArray, result, parameterCount);
        }
    }

    return result;
}



/**
 * @typedef  {Object} Point
 * @property {number} x
 * @property {number} y
*/

/**
 * Converts Point to arrray-based Point
 * @param {Point} point 
 * @returns {Array.number} [x, y] 
 */
function pointToArray(point) {
    if (Array.isArray(point)) {
        return point;
    }
    if (Object.hasOwn(point, "x")) {
        return [point.x, point.y];
    }
    if (Object.hasOwn(point, "X")) {
        return [point.X, point.Y];
    }
    return null;
}

/**
 * Distance between a pair of two-dimensional Points.
 * @example  distance([-2, -2], [2, 1]) == 5
 * @param {Point} p1 First Point
 * @param {Point} p2 Second Point
 * @returns {number} Distance
 */
export function distance(p1, p2) {
    p1 = pointToArray(p1);
    p2 = pointToArray(p2);
    return Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
}


/**
 * Checks if an object represents a valid coordinate.
 * @param {*} p 
 * @returns {boolean}
 */
function checkCoordinate(p) {
    if (typeof p !== "object" || p === null || p == undefined) {
        return false;
    }
    if (Array.isArray(p) && p.length >= 2) {
        return !isNaN(p[0]) && !isNaN(p[1]);
    }
    if (Object.hasOwn(p, "x") && Object.hasOwn(p, "y")) {
        return !isNaN(p.x) && !isNaN(p.y);
    }
    if (Object.hasOwn(p, "X") && Object.hasOwn(p, "Y")) {
        return !isNaN(p.X) && !isNaN(p.Y);
    }
    return false;
}

/**
 * Converts barycentric coordinates on a triangle to cartesian coordinates.
 * Needs 3 Points and 
 * @param {Point} p1 
 * @param {Point} p2 
 * @param {Point} p3 
 * @param {Array.number} bary 
 * @returns {Point}
 */
function barycentricToCartesian(p1, p2, p3, bary) {
    const barSum = bary.reduce((s, c) => { return s + c }, 0);
    const hom = bary.map((c) => { return c / barSum });
    const valArray = [pointToArray(p1), pointToArray(p2), pointToArray(p3)];
    return {
        x: valArray.reduce((s, c, i) => { return s + hom[i] * c[0] }, 0),
        y: valArray.reduce((s, c, i) => { return s + hom[i] * c[1] }, 0)
    }
}

/**
 * Calculates radius of a triangles incircle .
 * @param {number} a Length of side a
 * @param {number} b Length of side b
 * @param {number} c Length of side c
 * @returns {number} 
 */
function incircleRadius(a, b, c) {
    const s = 0.5 * (a + b + c);
    return Math.sqrt(((s - a) * (s - b) * (s - c)) / s);
}

/**
 * Calculates side lengths and angular values of a trinagle defined by 3 two-dimensional Points.
 * Additionally the area, circumcircle, incircle and centroid of the triangle are calculated.
 * Points can be Arrays or Objects. 
 * @example
 * let solved=solvePoints([-1, 2.1], {x:3, y:2}, {X:4, Y:-1});
 * @param {Point} A - First Point
 * @param {Point} B - Second Point
 * @param {Point} C - Third Point
 * @param {string} mode - Specifies if angles should be in degrees or radians
 * @returns {solveResult} - Additionally contains the original Points
 */
export function solvePoints(A, B, C, mode = "deg") {
    /* Copy Points so later changes won't affect returned Object */
    //A = Object.assign({}, A);
    //B = Object.assign({}, B);
    //C = Object.assign({}, C);
    const result = { A, B, C, mode, solutions: [] };
    /* Validate Input */
    const nameArray = ["A", "B", "C"];
    const valArray = [A, B, C];
    for (let i = 0; i < 3; i++) {
        if (!checkCoordinate(valArray[i])) {
            result.error = `Illegal Parameter: ${nameArray[i]}: ${String(JSON.stringify(valArray[i])).replaceAll("\"", "'")} - Must be [x,y], {x,y} or {X,Y}.`;
            return result;
        }
    } for (let i = 0; i < 3; i++) {
        if (distance(valArray[i], valArray[(i + 1) % 3]) === 0) {
            const coordinates1 = Array.isArray(valArray[i]) ? `[${valArray[i]}]` : `{${Object.entries(valArray[i]).map(e => { return e.join(":") })}}`;
            const coordinates2 = Array.isArray(valArray[(i + 1) % 3]) ? `[${valArray[(i + 1) % 3]}]` : `{${Object.entries(valArray[(i + 1) % 3]).map(e => { return e.join(":") })}}`;
            result.error = `Repeated Coordinates: ${nameArray[(i)]}: ${coordinates1} and ${nameArray[(i + 1) % 3]}: ${coordinates2} - Coordinates must be unique.`;
            return result;
        }
    }

    const sideAB = distance(A, B);//c
    const sideBC = distance(B, C);//a
    const sideCA = distance(C, A);//b

    /* Setting angle mode */
    if (mode !== "deg" && mode !== "rad") {
        result.error = `Unknown mode: ${mode} - Must be "deg" or "rad"`
        return result;
    }
    let modeOutConv = mode === "deg" ? toDeg : 1;

    /* Calculate angles */
    const angleA = Math.acos((sideCA ** 2 + sideAB ** 2 - sideBC ** 2) / (2 * sideCA * sideAB));
    const angleB = Math.acos((sideBC ** 2 + sideAB ** 2 - sideCA ** 2) / (2 * sideBC * sideAB));
    const angleC = angleSum - angleA - angleB;

    /* Check if any angle is 0 or NaN */
    if ([angleA, angleB, angleC].some(x => { return !x })) {
        result.error = `Unsolvable: Impossible combination of side lengths: ${[sideBC, sideCA, sideAB].join(", ")}`;
        return result;
    }

    /* 
    Create solution object, only one solution is possible.
    For consistency with the general solve function values are duplicated and the object is stored in the results.solutions Array.
    */
    const solution = {};
    solution.angleA = modeOutConv * angleA;//alpha
    solution.angleB = modeOutConv * angleB;//beta
    solution.angleC = modeOutConv * angleC;//gamma

    solution.sideAB = sideAB;
    solution.sideBC = sideBC;
    solution.sideCA = sideCA;

    solution.a = solution.sideBC;
    solution.b = solution.sideCA;
    solution.c = solution.sideAB;

    solution.alpha = solution.angleA;
    solution.beta = solution.angleB;
    solution.gamma = solution.angleC;

    solution.area = 0.5 * sideAB * sideBC * Math.sin(angleB);

    /* Convert to Array based Points for simpler code */
    const pA = pointToArray(A);
    const pB = pointToArray(B);
    const pC = pointToArray(C);

    /* Barycentric coordinates are used to calculate the following values */
    solution.centroid = barycentricToCartesian(pA, pB, pC, [1 / 3, 1 / 3, 1 / 3]);

    solution.incircle = {
        center: barycentricToCartesian(pA, pB, pC, [sideBC, sideCA, sideAB]),
        radius: incircleRadius(sideAB, sideBC, sideCA)
    };

    solution.circumcircle = {
        center: barycentricToCartesian(pA, pB, pC, [Math.sin(2 * angleA), Math.sin(2 * angleB), Math.sin(2 * angleC)]),
        radius: (sideBC / Math.sin(angleA)) / 2
    };

    /* height lengths */
    solution.ha = (solution.b * solution.c) / (2 * solution.circumcircle.radius);
    solution.hb = (solution.a * solution.c) / (2 * solution.circumcircle.radius);
    solution.hc = (solution.a * solution.b) / (2 * solution.circumcircle.radius);

    result.solutions = [solution];
    return result;
}
