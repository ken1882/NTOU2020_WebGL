/**---------------------------------------------------------------------------
 * The Rectangle object for abbreviation of PIXI's one
 * @class Rect
 */
class Rect{
  /**
   * @constructor
   * @param {Object} rect - initialize by the object that contain rect data
   * @param {...Number} [params] - initialize by given x, y, w, h
   * @param {Number} x - The X point of the bitmap
   * @param {Number} y - The Y point of the bitmap
   * @param {Number} width - The width of the bitmap
   * @param {Number} height - The height of the bitmap
   */
  constructor(...args){
    let arglen = validArgCount.apply(window, args);
    if(arglen == 1){
      this.x = args[0].x;
      this.y = args[0].y;
      this.width = args[0].width;
      this.height = args[0].height;
    }
    else if(arglen == 4){
      this.x = args[0];
      this.y = args[1];
      this.width = args[2];
      this.height = args[3];
    }
  }
  /**
   * Check whether given point in the rect
   * @param {Integer} x 
   * @param {Integer} y 
   */
  contains(x, y){
    return this.x <= x && x <= this.x+this.width && this.y <= y && y <= this.y+this.height
  }
}

/**
 * Drawable object of WebGL
 * @class Drawable
 */
class Drawable{
  /**
   * @param {mat4} vmatrix View matrix
   * @param {mat4} mmatrix Model matrix
   * @param {mat4} pmatrix Projection matrix
   * @param {Array} vbuffer Vertices buffer
   * @param {Array} cbuffer Color buffer
   * @param {Integer} text_id Texure id
   * @param {Integer} type Object type id
   */
  constructor(vmatrix, mmatrix, pmatrix, vbuffer, cbuffer, method, type, text_id=null){
    this.view_matrix = vmatrix;
    this.model_matrix = mmatrix;
    this.projection_matrix = pmatrix;
    this.vertex_buffer = vbuffer;
    this.color_buffer = cbuffer;
    this.method = method;
    this.type = type;
    if(!text_id){text_id = 0;}
    this.texture_id = text_id;
    this.rotation = [0, 0, 0];
  }
  /**
   * > Free the buffer, should not be drawn again after this method called
   */
  dispose(){
    GL.deleteBuffer(this.vertex_buffer);
    GL.deleteBuffer(this.color_buffer);
  }
  /**
   * 
   * @param {vec3} anchor Rotation anchor
   * @param {vec3} scale  Rotation scaler vector of xyz
   * @param {float} scale_mul Multiplier of the scaler vector
   */
  rotate(anchor, scale, scale_mul=1.0){
    let vmat = this.view_matrix;
    let mmat = this.model_matrix;

    let rx = deg2rad(scale[0] * scale_mul);
    let ry = deg2rad(scale[1] * scale_mul);
    let rz = deg2rad(scale[2] * scale_mul);
    
    this.rotation[0] += deg2rad(scale[0] * scale_mul);
    this.rotation[1] += deg2rad(scale[1] * scale_mul);
    this.rotation[2] += deg2rad(scale[2] * scale_mul);
    this.rotation[0] %= ROUND_RAD;
    this.rotation[0] %= ROUND_RAD;
    this.rotation[0] %= ROUND_RAD;
    
    mat4.rotateX(mmat, rx, anchor[0]);
    mat4.rotateY(mmat, ry, anchor[1]);
    mat4.rotateZ(mmat, rz, anchor[2]);

    GL.uniform1f(shaderProgram.textureID, this.texture_id);
    PushMatrix("model", mmat);
    PushMatrix("view", vmat);
    PushMatrix("projection", this.projection_matrix);
    if(this.type == OBJTYPE_2D){
      drawBuffer(this.vertex_buffer, this.color_buffer, this.method);
    }
    else if(this.type == OBJTYPE_3D){
      drawCubeBuffer(this.vertex_buffer, this.color_buffer, this.method);
    }
    PopMatrix("projection");
    PopMatrix("view");
    PopMatrix("model");
    
  }
  /**
   * > Mobe object
   * @param {Float} dx Delta X - (Left <=> Right) +
   * @param {Float} dy Delta Y - (Down <=> Up) +
   * @param {Float} dz Delta Z - (back <=> front) +
   * @param {float} scale_mul Multiplier of the scaler vector
   */
  move(dx, dy, dz, scale_mul=1.0){
    dx *= scale_mul;
    dy *= scale_mul;
    dz *= scale_mul;

    let vmat = this.view_matrix;

    mat4.translate(vmat, [dx, dy, dz]);

    PushMatrix("model", this.model_matrix);
    PushMatrix("view", vmat);
    PushMatrix("projection", this.projection_matrix);
    if(this.type == OBJTYPE_2D){
      drawBuffer(this.vertex_buffer, this.color_buffer, this.method);
    }
    else if(this.type == OBJTYPE_3D){
      drawCubeBuffer(this.vertex_buffer, this.color_buffer, this.method);
    }
    PopMatrix("projection");
    PopMatrix("view");
    PopMatrix("model");
  }
}