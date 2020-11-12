let GLShaderVertexPos   = "aVertexPosition";
let GLShaderVertexColor = "aVertexColor";
let GLShaderMovMatrix   = "uMVMatrix";
let GLShaderProjMatrix  = "uPMatrix";
let GLShaderDefaultColor = [1.0, 1.0, 1.0, 1.0];
let GLTextureID = "iTextureId"
let BackgroundColor = [0.25, 0.25, 0.25, 1.0];
let ViewportWidth  = 500;
let ViewportHeight = 500;


function initGL(canvas) {
    try {
        window.gl = canvas.getContext("experimental-webgl");
        window.gl.viewportWidth = canvas.width;
        window.gl.viewportHeight = canvas.height;
        window.gl.getExtension("EXT_frag_depth"); // Enable fragment shader depth ext
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
    uniform float ${GLTextureID};

    varying vec4 vColor;
    varying float _texture;
    void main(void) {
        vColor = ${GLShaderVertexColor};
        _texture = ${GLTextureID};
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
    #extension GL_EXT_frag_depth : enable
    precision mediump float;
    
    varying vec4 vColor;
    varying float _texture;

    int _mod(int a, int b){
        return a - b*(a/b);
    }

    vec3 getTextureColor(vec2 pos){
        float a, b, c;
        pos.x /= ${ViewportWidth}.0;
        pos.y /= ${ViewportHeight}.0;
        a = vColor.x;
        b = vColor.y - (pos.x * pos.x);
        c = vColor.z - (pos.y * pos.y);
        
        int unit_leni = 20;
        float unit_lenf = float(unit_leni);
        int ux = int(pos.x * ${ViewportWidth}.0) / unit_leni;
        int uy = int(pos.y * ${ViewportHeight}.0) / unit_leni;
        float fux = float(ux), fuy = float(uy);

        float cx = float((fux+0.5) * unit_lenf), cy = float((fuy+0.5) * unit_lenf);
        float dx = float(pos.x * ${ViewportWidth}.0)  - cx;
        float dy = float(pos.y * ${ViewportHeight}.0) - cy;
        float dlen = sqrt(dx*dx + dy*dy);

        if( dlen < 8.0 ){
            a -= (pos.x + pos.y);
            b += dx / unit_lenf;
            c += dy / unit_lenf;
        }
        vec3 _ret = vec3(a, b, c);
        return _ret;
    }

    vec3 getTextureColor2(vec2 pos){
        float a, b, c;
        pos.x /= ${ViewportWidth}.0;
        pos.y /= ${ViewportHeight}.0;
        a = vColor.x - (pos.x * pos.x);
        b = vColor.y ;
        c = vColor.z - (pos.y * pos.y);
        vec3 _ret = vec3(a, b, c);
        return _ret;
    }

    vec3 getTextureColor3(vec2 pos){
        float a, b, c;
        int uleni = 20;
        float ulenf = float(uleni);
        int ux = int(pos.x) / uleni, uy = int(pos.y) / uleni;

        pos.x /= ${ViewportWidth}.0;
        pos.y /= ${ViewportHeight}.0;

        if( _mod(ux+uy, 2) == 0){
            a = (vColor.x + vColor.y) / 2.0;
            b = vColor.z - (pos.x + pos.y) / 2.0;
            c = (vColor.x + vColor.y + vColor.z + pos.x + pos.y) / 5.0;
        }
        else{
            a = vColor.x - (pos.x * pos.x);
            b = vColor.y - (pos.y * pos.y);
            c = vColor.z;
        }
        vec3 _ret = vec3(a, b, c);
        return _ret;
    }
    
    float getPixelDepth(vec2 pos, float magic){
        float a = (pos.y / ${ViewportHeight}.0);
        if(magic == 2.0 && a > 0.62){a = 0.1;}
        return a;
    }

    void main(void) {
        vec3 _color;
        if(_texture == 1.0){_color = getTextureColor(gl_FragCoord.xy);}
        else if(_texture == 2.0){_color = getTextureColor2(gl_FragCoord.xy);}
        else if(_texture == 3.0){_color = getTextureColor3(gl_FragCoord.xy);}
        gl_FragColor = vec4(_color, 1.0);
        gl_FragDepthEXT = getPixelDepth(gl_FragCoord.xy, _texture);
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
    shaderProgram.textureID = gl.getUniformLocation(shaderProgram, GLTextureID);
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
 * @param option.texture ID of texture, color option will be ignored
 * @param  {...any} points Points to draw
 */
function drawPolygon2D(vp_mat, option, ...points){
    mat4.translate(movMatrix, vp_mat);
    var vertex_buffer = gl.createBuffer();
    let color_buffer = GL.createBuffer();
    let flag_uni_color = false; // Each point has different color
    let flag_same_tri_color = false; // Triangle filling with same color
    let flag_custom_color = !!option.color;
    if(option.texture){
        gl.uniform1f(shaderProgram.textureID, option.texture);
    }
    else if(option.color){
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
    drawBuffer(vertex_buffer, color_buffer, option.method);

    // reset model view matrix
    for(let i in vp_mat){vp_mat[i] *= -1;}
    mat4.translate(movMatrix, vp_mat);
}

function initCanvas(){
    gl.clearColor.apply(GL, BackgroundColor);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); //設定畫布大小,user可看區域
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  //清除畫布
    //正交投影
    //(垂直視角角度,長寬比,viewport不過近於0.1不遠於100,projection)
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, projMatrix);
    mat4.identity(movMatrix); //單位矩陣(移動回原點)
}