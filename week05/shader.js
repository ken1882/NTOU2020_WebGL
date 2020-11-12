let GLShaderVertexPos   = "aVertexPosition";
let GLShaderVertexColor = "aVertexColor";
let GLShaderViewMatrix  = "uViewMatrix";
let GLShaderModMatrix   = "uModelMatrix";
let GLShaderProjMatrix  = "uProjMatrix";
let GLShaderTextMatrix  = "uTextMatrix";
let GLShaderColorMatrix = "uColorMatrix";
let GLShaderRandomVector = "_RandomVector";
let GLShaderDefaultColor = [1.0, 1.0, 1.0, 1.0];
let GLTextureID = "iTextureId"
let BackgroundColor = [0.25, 0.25, 0.25, 1.0];
let ViewportWidth  = 500;
let ViewportHeight = 500;
let OBJTYPE_2D = 0;
let OBJTYPE_3D = 1;

let MatrixStack = ["view", "model", "projection", "texture", "color"]

// Access last element of Array
if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

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
        return ;
    }
}

function getvertexShader(gl) {
    var code = `
    attribute vec3 ${GLShaderVertexPos};    // Position
    attribute vec4 ${GLShaderVertexColor};  // Color

    uniform mat4 ${GLShaderViewMatrix};
    uniform mat4 ${GLShaderModMatrix};
    uniform mat4 ${GLShaderProjMatrix};
    uniform mat4 ${GLShaderTextMatrix};
    uniform mat4 ${GLShaderColorMatrix};
    uniform float ${GLTextureID};

    uniform vec3 ${GLShaderRandomVector};

    varying vec4 vColor;
    varying float _texture;
    varying vec3 randomVec;

    void main(void) {
        randomVec = ${GLShaderRandomVector};
        _texture = ${GLTextureID};
        gl_Position = ${GLShaderProjMatrix} * ${GLShaderViewMatrix} * ${GLShaderModMatrix} * vec4(${GLShaderVertexPos}, 1.0);
        vColor = ${GLShaderVertexColor};
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
    varying vec3 randomVec;

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

    vec3 getTextureColor4(vec2 pos){
        float a, b, c;
        pos.x /= ${ViewportWidth}.0;
        pos.y /= ${ViewportHeight}.0;
        a = 1.0;
        b = 1.0 - (pos.x - pos.y) * (pos.x - pos.y);
        c = 1.0 - (pos.x + pos.y) / 2.0;
        vec3 _ret = vec3(a, b, c);
        return _ret;
    }

    vec3 getTextureColor5(vec2 pos){
        float a, b, c;
        a = (sin(randomVec.x - pos.x) + 1.0) / 2.0;
        b = (sin(randomVec.y - pos.y) + 1.0) / 2.0;
        c = (sin(randomVec.x * randomVec.y - pos.y * pos.x) + 1.0) / 2.0;
        vec3 _ret = vec3(a, b, c);
        return _ret;
    }

    void main(void) {
        vec3 _color;
        if(_texture == 1.0){_color = getTextureColor(gl_FragCoord.xy);}
        else if(_texture == 2.0){_color = getTextureColor2(gl_FragCoord.xy);}
        else if(_texture == 3.0){_color = getTextureColor3(gl_FragCoord.xy);}
        else if(_texture == 4.0){_color = getTextureColor4(gl_FragCoord.xy);}
        else if(_texture == 5.0){_color = getTextureColor5(gl_FragCoord.xy);}
        else{ _color = vColor.xyz; }

        gl_FragColor = vec4(_color, 1.0);
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
window.shaderProgram = shaderProgram;

function initShaders() {
    var fragmentShader = getfragmentShader(gl);
    var vertexShader = getvertexShader(gl);

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
    shaderProgram.projMatrixUniform  = gl.getUniformLocation(shaderProgram, GLShaderProjMatrix);
    shaderProgram.viewMatrixUniform  = gl.getUniformLocation(shaderProgram, GLShaderViewMatrix);
    shaderProgram.modMatrixUniform   = gl.getUniformLocation(shaderProgram, GLShaderModMatrix);
    shaderProgram.colorMatrixUniform = gl.getUniformLocation(shaderProgram, GLShaderColorMatrix);
    shaderProgram.textMatrixUniform  = gl.getUniformLocation(shaderProgram, GLShaderTextMatrix);
    shaderProgram.textureID = gl.getUniformLocation(shaderProgram, GLTextureID);

    shaderProgram.randomVector = gl.getUniformLocation(shaderProgram, GLShaderRandomVector);
    GL.uniform3fv(shaderProgram.randomVector, [8101450.0, 18718763.0, 0.0]);

}

function initBasicMatrix(){
    for(let i=0;i<MatrixStack.length;++i){
        sym = MatrixStack[i].toLowerCase();
        MatrixStack[sym] = [];
    }
}

function setMatrixUniforms(proj, view, model=null, color=null, texture=null) {
    if(proj){
        gl.uniformMatrix4fv(shaderProgram.projMatrixUniform, false, proj);
        // console.log("Projection matrix set: ", proj);
    }
    if(view){
        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, view);
        // console.log("View matrix set: ", view);
    }
    if(model){
        gl.uniformMatrix4fv(shaderProgram.modMatrixUniform, false, model);
        // console.log("Model matrix set: ", model);
    }
    if(color){
        gl.uniformMatrix4fv(shaderProgram.colorMatrixUniform, false, color);
        // console.log("Color matrix set: ", color);
    }
    if(texture){
        gl.uniformMatrix4fv(shaderProgram.textMatrixUniform, false, texture);
        // console.log("Texture matrix set: ", texture);
    }
}

function PushMatrix(sym, mat){
    return MatrixStack[sym.toLowerCase()].push(mat);
}

function PopMatrix(sym, mat){
    return MatrixStack[sym.toLowerCase()].pop(mat);
}

function TopMatrix(sym){
    return MatrixStack[sym.toLowerCase()].last();
}

function drawBuffer(vert_buf, color_buf, method){
    GL.bindBuffer(GL.ARRAY_BUFFER, vert_buf);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vert_buf.data), GL.STATIC_DRAW);
    //(index, size, type, normalized, stride, offset)
    GL.vertexAttribPointer(shaderProgram.vertexPosAttribute, vert_buf.dimension, GL.FLOAT, false, 0, 0);

    GL.bindBuffer(GL.ARRAY_BUFFER, color_buf);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(color_buf.data), GL.STATIC_DRAW);
    GL.vertexAttribPointer(shaderProgram.vertexColorAttribute, color_buf.channel_size, GL.FLOAT, false, 0, 0);
    setMatrixUniforms(
        TopMatrix("projection"), TopMatrix("view"), TopMatrix("model"), 
        TopMatrix("color"), TopMatrix("texture")
    );
    GL.drawArrays(method, 0, vert_buf.vertex_size);
}

function drawCubeBuffer(vert_buf, color_buf){
    GL.bindBuffer(GL.ARRAY_BUFFER, vert_buf);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vert_buf.data), GL.STATIC_DRAW);
    GL.vertexAttribPointer(shaderProgram.vertexPosAttribute, vert_buf.dimension, GL.FLOAT, false, 0, 0);

    GL.bindBuffer(GL.ARRAY_BUFFER, color_buf);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(color_buf.data), GL.STATIC_DRAW);
    GL.vertexAttribPointer(shaderProgram.vertexColorAttribute, color_buf.channel_size, GL.FLOAT, false, 0, 0);

    vert_idx_buffer = GL.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vert_idx_buffer);
    let vidx_ar = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vidx_ar), gl.STATIC_DRAW);
    vert_idx_buffer.sube_size = 1;
    vert_idx_buffer.point_size = 36;
    setMatrixUniforms(
        TopMatrix("projection"), TopMatrix("view"), TopMatrix("model"), 
        TopMatrix("color"), TopMatrix("texture")
    );
    gl.drawElements(gl.TRIANGLES, vert_idx_buffer.point_size, gl.UNSIGNED_SHORT, 0);
}

function createDefaultProjMatrix(){
    let pmat = mat4.create();
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pmat);
    return pmat;
}

/**
 * > Draw a 2D flat polygon
 * @param {Array[3]} vp_mat Viewport Transformation Matrix
 * @param {Object} option options
 * @param option.method GL filling method
 * @param option.color  Color of verteices, single Array(4) for single color of the polygon, 
 *                      or define each color for every vertex. If using GL.TRIANGLES, can pass
 *                      the color array for each triangle instead of three same array for one triangle.
 * 
 * @param option.texture    ID of texture, color option will be ignored if value > 0 given
 * @param option.projMatrix Projection Matrix used, default will be used if none given
 * @param option.modMatrix  Model Matrix used, identity matrix will be used if none given
 * @param option.delbuf     Delete buffer after drawn, will not return any value if true
 * @param  {...any} points Points to draw
 * @returns {Drawable} A Drawable object contains shading data
 */
function drawPolygon2D(vp_mat, option, ...points){
    let pmat = null;
    let mmat = null;
    let vmat = mat4.create();
    mat4.identity(vmat);

    if(!option.projMartix){ pmat = createDefaultProjMatrix(); }
    if(!option.modMatrix){ mmat = mat4.create(); mat4.identity(mmat); }
    
    mat4.translate(vmat, vp_mat);
    PushMatrix("projection", pmat);
    PushMatrix("view", vmat);
    PushMatrix("model", mmat);

    var vertex_buffer = GL.createBuffer();
    let color_buffer = GL.createBuffer();
    let flag_uni_color = false; // Each point has different color
    let flag_same_tri_color = false; // Triangle filling with same color
    let flag_custom_color = !!option.color;
    if(option.texture){
        gl.uniform1f(shaderProgram.textureID, option.texture);
    }
    else if(option.color){
        flag_uni_color = isClassOf(option.color[0], Array);
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
    PopMatrix("projection");
    PopMatrix("view");
    PopMatrix("model");
    if(!!option.delbuf){
        GL.deleteBuffer(vertex_buffer);
        GL.deleteBuffer(color_buffer);
    }
    else{
        return new Drawable(
            vmat, mmat, pmat, vertex_buffer, color_buffer, option.method, OBJTYPE_2D, option.texture
        );
    }
}

/**
 * > Draw a 3D cube
 * @param {Array[3]} vp_mat Viewport Transformation Matrix
 * @param {Object} option options
 * @param option.color  Color of verteices in the cube
 * @param option.texture    ID of texture, color option will be ignored if value > 0 given
 * @param option.projMatrix Projection Matrix used, default will be used if none given
 * @param option.modMatrix  Model Matrix used, identity matrix will be used if none given
 * @param option.delbuf     Delete buffer after drawn, will not return any value if true
 * @param pt_ufr Upper-front-right point of the cube
 * @param pt_ufl Upper-front-left point of the cube
 * @param pt_ubl Upper-back-left
 * @param pt_ubr Upper-back-right point of the cube
 * @param pt_lfr Lower-front-right point of the cube
 * @param pt_lfl Lower-front-left point of the cube
 * @param pt_lbl Lower-back-left point of the cube
 * @param pt_lbr Lower-back-right point of the cube
 * @returns {Drawable} A Drawable object contains shading data
 */
function drawCube(vp_mat, option, pt_ufr, pt_ufl, pt_ubl, pt_ubr, pt_lfr, pt_lfl, pt_lbl, pt_lbr){
    let pmat = null;
    let mmat = null;
    let vmat = mat4.create();
    mat4.identity(vmat);

    if(!option.projMartix){ pmat = createDefaultProjMatrix(); }
    else{ pmat = option.projMatrix; }
    if(!option.modMatrix){ mmat = mat4.create(); mat4.identity(mmat); }
    else{ mmat = option.modMatrix; }
    
    mat4.translate(vmat, vp_mat);
    PushMatrix("projection", pmat);
    PushMatrix("view", vmat);
    PushMatrix("model", mmat);

    var vertex_buffer = GL.createBuffer();
    let color_buffer = GL.createBuffer();
    let flag_custom_color = !!option.color;
    var vertices = [].concat(pt_lfl).concat(pt_lfr).concat(pt_ufr).concat(pt_ufl)  // front
                     .concat(pt_lbl).concat(pt_ubl).concat(pt_ubr).concat(pt_lbr)  // back
                     .concat(pt_ubl).concat(pt_ufl).concat(pt_ufr).concat(pt_ubr)  // top
                     .concat(pt_lbl).concat(pt_lbr).concat(pt_lfr).concat(pt_lfl)  // bottom
                     .concat(pt_lbr).concat(pt_ubr).concat(pt_ufr).concat(pt_lfr)  // right
                     .concat(pt_lbl).concat(pt_lfl).concat(pt_ufl).concat(pt_ubl); // left
    
    var color_data = [];
    if(option.texture){
        gl.uniform1f(shaderProgram.textureID, option.texture);
    }
    else if(flag_custom_color){
        if(option.color.length == 6){ // single color for 6 faces
            for(let i=0;i<option.color.length;++i){
                for(let j=0;j<4;++j){
                    color_data = color_data.concat(option.color[i]);
                }
            }
        }
        else{
            for(let i=0;i<option.color.length;++i){
                color_data = color_data.concat(option.color);
            }
        }
    }
    else{
        default_color = [
            [1.0, 0.0, 0.0, 1.0], // Front face
            [0.0, 1.0, 0.0, 1.0], // Back face
            [0.0, 0.0, 1.0, 1.0], // Top face
            [1.0, 0.0, 1.0, 1.0], // Bottom face
            [0.0, 0.0, 1.0, 1.0], // Right face
            [1.0, 1.0, 0.0, 1.0]  // Left face
        ];
        for(let i=0;i<default_color.length;++i){
            for(let j=0;j<4;++j){
                color_data = color_data.concat(default_color[i]);
            }
        }
    }
    color_data = color_data.flat();
    
    vertex_buffer.data = vertices;
    vertex_buffer.dimension = 3;
    vertex_buffer.vertex_size = (vertices.length / 3);
    color_buffer.data = color_data;
    color_buffer.channel_size = 4;
    drawCubeBuffer(vertex_buffer, color_buffer);
    PopMatrix("projection");
    PopMatrix("view");
    PopMatrix("model");
    if(!!option.delbuf){
        GL.deleteBuffer(vertex_buffer);
        GL.deleteBuffer(color_buffer);
    }
    else{
        return new Drawable(
            vmat, mmat, pmat, vertex_buffer, color_buffer, option.method, OBJTYPE_3D, option.texture
        );
    }
}

function initCanvas(){
    gl.clearColor.apply(GL, BackgroundColor);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    window._lastUpdateTime = Date.now();
    requestAnimFrame(update_main);
}

function update_main(){
    requestAnimFrame(update_main);
    cur_time = Date.now();
    dt = Date.now() - window._lastUpdateTime;
    update_input(dt);
    update_frame(dt);
    window._lastUpdateTime = cur_time;
}

window.FrameTickHandlers = {}
/**
 * > Calling `window.FrameTickHandlers(dt)` every frame tick
 * @param {Integer} dt Delta time in milisecond since last update called
 */
function update_frame(dt){
    let _len = getObjKeySize(FrameTickHandlers);
    if(_len > 0){
        gl.clearColor.apply(GL, BackgroundColor);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    
    for(let i in FrameTickHandlers){
        if(FrameTickHandlers.hasOwnProperty(i) && FrameTickHandlers[i]){
            FrameTickHandlers[i](dt);
        }
    }
}

/**
 * > The given function to be called during each frame tick/update
 * @param {Function} handler The funciton to be called
 * @param {String} symbol (Optional)Tracking symbol of the handler
 * @returns {String} Tracking symbol of the handler
 */
function registerTickHandler(handler, symbol=null){
    if(!symbol){
        symbol = getObjKeySize(window.FrameTickHandlers) + 1;
    }
    window.FrameTickHandlers[symbol] = handler
    return symbol;
}

/**
 * > Removes the handler from the  frame loop
 * @param {String} symbol 
 */
function removeTickHandler(symbol){
    window.FrameTickHandlers[symbol] = undefined;
}

function update_input(_){
    Input.update();
}