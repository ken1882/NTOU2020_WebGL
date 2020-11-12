function initGL(canvas) {
    try {
        window.gl = canvas.getContext("experimental-webgl");
        window.gl.viewportWidth = canvas.width;
        window.gl.viewportHeight = canvas.height;
        window.GL = gl;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialize WebGL, sorry :-(");
    }
}

function is_a(obj, type){
    return obj.constructor == type
}

function getvertexShader(gl) {
    var str = `
    attribute vec3 aVertexPosition;
    uniform mat4 uMVMatrix; //模型視圖矩陣
    uniform mat4 uPMatrix;  //投影矩陣
    void main(void) {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    }
    `;
    //建立
    var shader;
    shader = gl.createShader(gl.VERTEX_SHADER);
    //編譯
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function getfragmentShader(gl) {
    var str = `
    precision mediump float;
    void main(void) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);  //白色 (Red, Green, Blue, Alpha)
    }
    `;
    //建立
    var shader;
    shader = gl.createShader(gl.FRAGMENT_SHADER);
    //編譯
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}
var shaderProgram;
function initShaders() {  //著色器
    var fragmentShader = getfragmentShader(gl);
    var vertexShader = getvertexShader(gl);

    /*添加片段著色器(fragment shader)和頂點著色器(vertex shader)到
    webgl program(二進制碼，可存一個片段與一個頂點著色器)*/
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialize shaders");
    }
    gl.useProgram(shaderProgram);
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);//提供數值給矩陣的屬性
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, projMatrix);  //將投影矩陣(projection matrix)寫入相應的內存
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, movMatrix);//模型視圖矩陣(model view matrix)
}

function initBasicMatrix(){
    window.movMatrix  = mat4.create();
    window.projMatrix = mat4.create();
}

function drawBuffer(buffer, method){
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    //(index, size, type, normalized, stride, offset)
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, buffer.dimension, gl.FLOAT, false, 0, 0);
    setMatrixUniforms(projMatrix, movMatrix);//矩陣參數傳入顯示卡
    gl.drawArrays(method, 0, buffer.points);
}

function drawTriangle2D(vp_mat, a, b, c, color=[0,0,0,1]){
    mat4.translate(movMatrix, vp_mat);
    var vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    a = a.concat(0); b = b.concat(0); c = c.concat(0);
    var vertices = a.concat(b).concat(c);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    vertex_buffer.dimension = 3;
    vertex_buffer.points = 3;
    drawBuffer(vertex_buffer, gl.TRIANGLES)
}

function drawRect2D(vp_mat, a, b, c, d, method=gl.TRIANGLE_STRIP, color=[0,0,0,1]){
    mat4.translate(movMatrix, vp_mat);
    var vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    a = a.concat(0); b = b.concat(0); c = c.concat(0); d = d.concat(0);
    var vertices = a.concat(b).concat(c).concat(d);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    vertex_buffer.dimension = 3;
    vertex_buffer.points = 4;
    drawBuffer(vertex_buffer, method)
}
/**
 * 
 * @param {Array[3]} vp_mat Viewport Transformation Matrix
 * @param {Object} option options
 * @param option.method GL filling method
 * @param option.colors Color of verteices
 * @param  {...any} points Points to draw
 */
function drawPolygon2D(vp_mat, option, ...points){
    mat4.translate(movMatrix, vp_mat);
    var vertex_buffer = gl.createBuffer();
    GL.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    var vertices = []
    for(let i=0;i<points.length;++i){
        vertices = vertices.concat(points[i]).concat(0);
    }
    gl.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    if(option.colors){
        color_buffer = gl.createBuffer();
        if(option.colors[0]){}
        //GL.bindBuffer(GL.ARRAY_BUFFER, )
    }
    vertex_buffer.dimension = 3;
    vertex_buffer.points = (vertices.length / 3);
    drawBuffer(vertex_buffer, option.method)
}

function initCanvas(){
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); //設定畫布大小,user可看區域
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  //清除畫布
    //正交投影
    //(垂直視角角度,長寬比,viewport不過近於0.1不遠於100,projection)
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, projMatrix);
    mat4.identity(movMatrix); //單位矩陣(移動回原點)
}