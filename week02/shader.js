let GLShaderVertexPos   = "aVertexPosition";
let GLShaderVertexColor = "aVertexColor";
let GLShaderMovMatrix   = "uMVMatrix";
let GLShaderProjMatrix  = "uPMatrix";
let GLShaderDefaultColor = [1.0, 1.0, 1.0, 1.0];
let BackgroundColor = [0.25, 0.25, 0.25, 1.0];

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
    var code = `
    attribute vec3 ${GLShaderVertexPos};    // Position
    attribute vec4 ${GLShaderVertexColor};  // Color
    uniform mat4 ${GLShaderMovMatrix};      // 模型視圖矩陣
    uniform mat4 ${GLShaderProjMatrix};     // 投影矩陣
    varying vec4 vColor;
    void main(void) {
        vColor = ${GLShaderVertexColor};
        gl_Position = ${GLShaderProjMatrix} * ${GLShaderMovMatrix} * vec4(${GLShaderVertexPos}, 1.0);
    }
    `;
    //建立
    var shader;
    shader = gl.createShader(gl.VERTEX_SHADER);
    //編譯
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function getfragmentShader(gl) {
    var code = `
    precision mediump float;
    varying vec4 vColor;

    void main(void) {
        gl_FragColor = vec4(vColor);
    }
    `;
    //建立
    var shader;
    shader = gl.createShader(gl.FRAGMENT_SHADER);
    //編譯
    gl.shaderSource(shader, code);
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
    shaderProgram.vertexPosAttribute = gl.getAttribLocation(shaderProgram, GLShaderVertexPos);
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, GLShaderVertexColor);
    
    gl.enableVertexAttribArray(shaderProgram.vertexPosAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    shaderProgram.projMatrixUniform = gl.getUniformLocation(shaderProgram, GLShaderProjMatrix);
    shaderProgram.movMatrixUniform = gl.getUniformLocation(shaderProgram, GLShaderMovMatrix);
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.projMatrixUniform, false, projMatrix);  //將投影矩陣(projection matrix)寫入相應的內存
    gl.uniformMatrix4fv(shaderProgram.movMatrixUniform, false, movMatrix);//模型視圖矩陣(model view matrix)
}

function initBasicMatrix(){
    window.projMatrix = mat4.create();
    window.movMatrix  = mat4.create();
}

function drawBuffer(vert_buf, color_buf, method){
    GL.bindBuffer(GL.ARRAY_BUFFER, vert_buf);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vert_buf.data), GL.STATIC_DRAW);
    //(index, size, type, normalized, stride, offset)
    GL.vertexAttribPointer(shaderProgram.vertexPosAttribute, vert_buf.dimension, GL.FLOAT, false, 0, 0);

    GL.bindBuffer(GL.ARRAY_BUFFER, color_buf);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(color_buf.data), GL.STATIC_DRAW);
    GL.vertexAttribPointer(shaderProgram.vertexColorAttribute, color_buf.channel_size, GL.FLOAT, false, 0, 0);

    setMatrixUniforms(projMatrix, movMatrix);//矩陣參數傳入顯示卡
    GL.drawArrays(method, 0, vert_buf.vertex_size);
}

/**
 * 
 * @param {Array[3]} vp_mat Viewport Transformation Matrix
 * @param {Object} option options
 * @param option.method GL filling method
 * @param option.color  Color of verteices, single Array(4) for single color of the polygon, 
 *                      or define each color for every vertex. If using GL.TRIANGLES, can pass
 *                      the color array for each triangle instead of three same array for one triangle.
 * @param  {...any} points Points to draw
 */
function drawPolygon2D(vp_mat, option, ...points){
    mat4.translate(movMatrix, vp_mat);
    var vertex_buffer = gl.createBuffer();
    let color_buffer = GL.createBuffer();
    let flag_uni_color = false; // Each point has different color
    let flag_same_tri_color = false; // Triangle filling with same color
    let flag_custom_color = !!option.color;
    if(option.color){
        flag_uni_color = is_a(option.color[0], Array);
        if(option.method == GL.TRIANGLES && option.color.length == points.length / 3){
            flag_same_tri_color = true;
        }
    }
    var vertices = [];
    var color_data = [];

    for(let i=0;i<points.length;++i){
        vertices = vertices.concat(points[i]).concat(0);

        // Fill color vertex
        if(flag_custom_color){
            if(flag_uni_color){ // Multiple color
                // Triangle filling with same color of the plane
                if(flag_same_tri_color){
                    if(i % 3 != 0){continue;}
                    var _cidx = parseInt(i/3);
                    for(let j=0;j<3;++j){color_data = color_data.concat(option.color[_cidx]);}
                }
                else{ color_data = color_data.concat(option.color[i]); }
            }
            else{ // single color
                color_data = color_data.concat(option.color);
            }
        }
        else{
            color_data = color_data.concat(GLShaderDefaultColor);
        }
    }
    
    vertex_buffer.data = vertices;
    vertex_buffer.dimension = 3;
    vertex_buffer.vertex_size = (vertices.length / 3);
    color_buffer.data = color_data;
    color_buffer.channel_size = 4;
    drawBuffer(vertex_buffer, color_buffer, option.method)
}

function initCanvas(){
    gl.clearColor.apply(GL, BackgroundColor);
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); //設定畫布大小,user可看區域
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  //清除畫布
    //正交投影
    //(垂直視角角度,長寬比,viewport不過近於0.1不遠於100,projection)
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, projMatrix);
    mat4.identity(movMatrix); //單位矩陣(移動回原點)
}