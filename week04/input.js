/**---------------------------------------------------------------------------
 * The static class handles the input
 *
 * @class Input
 * @property {Array.<Number>} mousePagePOS - mouse position in the web page
 * @property {Array.<Nunber>} mouseClientPOS - mouse position in window viewport
 */
class Input{
  /**-------------------------------------------------------------------------
   * @constructor
   * @memberof Input
   */
  constructor(){
    throw new Error('This is a static class');
  }
  /**-------------------------------------------------------------------------
   * > Module initialization
   * @memberof Input
   * @property {Array.<boolean>} keystate_press   - array of pressed flag key ids
   * @property {Array.<boolean>} keystate_trigger - array of trigger flag key ids
   * @property {boolean} state_changed - key state changed flag
   * @property {boolean} reset_needed  - flag of whether need to reset keystates
   */
  static initialize(){
    this.setup_keymap();
    this.keystate_press   = new Array(0xff);
    this.keystate_trigger = new Array(0xff);
    this.state_changed    = false;
    this.reset_needed     = false;
    this.wheelstate       = 0;
    this.mouseAppPOS      = [0, 0];
    this.mouseClientPOS   = [0, 0];
    this.mousePagePOS     = [0, 0];
    this.setupEventHandlers();
  }
  /**-------------------------------------------------------------------------
   * > Setup keymap for acceptable keys
   * @property {object} keymap - key map, mapping to the key id
   */
  static setup_keymap(){
    this.keymap = { 
      kMOUSE1: 1, kMOUSE2: 2, kMOUSE3: 3,
      k0: 48, k1: 49, k2: 50, k3: 51, k4: 52, k5: 53,
      k6: 54, k7: 55, k8: 56, k9: 57,
      
      kA: 65, kB: 66, kC: 67, kD: 68, kE: 69, kF: 70,
      kG: 71, kH: 72, kI: 73, kJ: 74, kK: 75, kL: 76,
      kM: 77, kN: 78, kO: 79, kP: 80, kQ: 81, kR: 82,
      kS: 83, kT: 84, kU: 85, kV: 86, kW: 87, kX: 88,
      kY: 89, kZ: 90,
      
      kENTER: 13,    kRETURN: 13,  kBACKSPACE: 8, kSPACE: 32,
      kESCAPE: 27,   kESC: 27,     kSHIFT: 16,    kTAB: 9,
      kALT: 18,      kCTRL: 17,    kDELETE: 46,   kDEL: 46,
      kINSERT: 45,   kINS: 45,     kPAGEUP: 33,   kPUP: 33,
      kPAGEDOWN: 34, kPDOWN: 34,   kHOME: 36,     kEND: 35,
      kLALT: 164,    kLCTRL: 162,  kRALT: 165,    kRCTRL: 163,
      kLSHIFT: 160,  kRSHIFT: 161,
      
      kLEFT: 37, kRIGHT: 39, kUP: 38, kDOWN: 40,
      
      kCOLON: 186,     kAPOSTROPHE: 222, kQUOTE: 222,
      kCOMMA: 188,     kPERIOD: 190,     kSLASH: 191,
      kBACKSLASH: 220, kLEFTBRACE: 219,  kRIGHTBRACE: 221,
      kMINUS: 189,     kUNDERSCORE: 189, kPLUS: 187,
      kEQUAL: 187,     kEQUALS: 187,     kTILDE: 192,
      
      kF1: 112,  kF2: 113,  kF3: 114, kF4: 115, kF5: 116,
      kF6: 117,  kF7: 118,  kF8: 119, kF9: 120, kF10: 121,
      kF11: 122, kF12: 123,
      
      kArrows: 224,
    }

    this.webKeymap = {
      F1: 'kF1', F2: 'kF2', F3: 'kF3', F4: 'kF4', F5: 'kF5', F6: 'kF6', 
      F7: 'kF7', F8: 'kF8', F9: 'kF9', F10: 'kF10', F11: 'kF11', F12: 'kF12',

      KeyA: 'kA', KeyB: 'kB', KeyC: 'kC', KeyD: 'kD', KeyE: 'kE', KeyF: 'kF', 
      KeyG: 'kG', KeyH: 'kH', KeyI: 'kI', KeyJ: 'kJ', KeyK: 'kK', KeyL: 'kL', 
      KeyM: 'kM', KeyN: 'kN', KeyO: 'kO', KeyP: 'kP', KeyQ: 'kQ', KeyR: 'kR', 
      KeyS: 'kS', KeyT: 'kT', KeyU: 'kU', KeyV: 'kV', KeyW: 'kW', KeyX: 'kX', 
      KeyY: 'kY', KeyZ: 'kZ',

      ShiftLeft: ['kShift', 'kLShift'], ShiftRight: ['kShift', 'kRShift'],
      AltLeft: ['kAlt', 'kLAlt'], AltRight: ['kAlt', 'kRAlt'],

      Enter: ['kENTER', 'kRETURN'], Space: 'kSPACE', BackSpace: 'kBACKSPACE',
      Escape: ['kESC', 'kESCAPE'], 
      ControlLeft: ['kCTRL', 'kLCTRL'], ControlRight: ['kCTRL', 'kRCTRL']
    }
  }
  /**-------------------------------------------------------------------------
   * > Process when key is down
   * @param {KeyboardEvent|MouseEvent} event - the keydown event
   */
  static onKeydown(event){
    let ksym = this.webKeymap[event.code];
    if(!ksym){return ;}
    if(isClassOf(ksym, Array)){
      for(let i=0;i<ksym.length;++i){
        let vk = this.keymap[ksym[i]];
        if(!this.keystate_press[vk]){
          this.keystate_trigger[vk] = true;
        }
        this.keystate_press[vk] = true;
      }
    }
    else{
      let vk = this.keymap[ksym];
      if(!this.keystate_press[vk]){
        this.keystate_trigger[vk] = true;
      }
      this.keystate_press[vk] = true;
    }
    this.state_changed = true;
  }
  /**-------------------------------------------------------------------------
   * > Process when key is up
   * @param {KeyboardEvent|MouseEvent} event - the keyup event
   */
  static onKeyup(event){
    let ksym = this.webKeymap[event.code];
    if(!ksym){return ;}
    if(isClassOf(ksym, Array)){
      for(let i=0;i<ksym.length;++i){
        let vk = this.keymap[ksym[i]];
        this.keystate_press[vk] = false;
      }
    }
    else{
      let vk = this.keymap[ksym];
      this.keystate_press[vk] = false;
    }
    this.state_changed = true;
  }
  /**-------------------------------------------------------------------------
   * > Mouse wheel handler
   */
  static processMouseWheel(event){
    this.wheelstate = Math.max( -1, Math.min(1, (event.wheelDelta || -event.detail)) );
    this.state_changed = true;
  }
  /**-------------------------------------------------------------------------
   * > Record client mouse pos
   * @param {MouseEvent} event 
   */
  static processMouseMove(event){
    let px = event.pageX || 0, py = event.pageY || 0;
    this._mouseMoved    = !(isArrayalike([px, py], this.mousePagePOS));
    this.mousePagePOS   = [px, py];
    this.mouseClientPOS = [event.clientX || 0, event.clientY || 0];
    this.state_changed  = true;
  }
  /*-------------------------------------------------------------------------*/
  static setupEventHandlers(){
    window.addEventListener("keydown", this.onKeydown.bind(this));
    window.addEventListener("keyup", this.onKeyup.bind(this));
    window.addEventListener("mousedown", this.onKeydown.bind(this));
    window.addEventListener("mouseup", this.onKeyup.bind(this));
    window.addEventListener("mousewheel", this.processMouseWheel.bind(this));
    document.addEventListener("mousemove", this.processMouseMove.bind(this));
  }
  /**-------------------------------------------------------------------------
   * > Frame update
   * @memberof Input
   */
  static update(){
    if(this.state_changed){
      this.state_changed = false;
      this.reset_needed  = true;
    }
    else if(this.reset_needed){
      this._mouseMoved  = false;
      this.reset_needed = false;
      for(let i=0;i<0xff;++i){this.keystate_trigger[i] = false;}
      this.wheelstate = 0;
    }
  }
  /**-------------------------------------------------------------------------
   * > Check whether mouse is in certain area
   * @param {Rect} crect - the collision rect
   */
  static isMouseInArea(crect){
    return crect.contains(this.mouseAppPOS[0], this.mouseAppPOS[1]);
  }
  /**-------------------------------------------------------------------------
   * > Check whether key is triggered in certain area
   * @param {Number} vk - virtual key id
   * @param {Rect} crect - collision rect
   */
  static isTriggerArea(vk, crect){
    if(!crect || !Input.mousePagePOS){return false;}
    if(!Input.isTriggered(vk)){return false;}
    if(Input.mousePagePOS[0] < crect.x){return false;}
    if(Input.mousePagePOS[1] < crect.y){return false;}
    let cwidth = crect.x + crect.width, cheight = crect.y + crect.height;
    if(Input.mousePagePOS[0] > cwidth){return false;}
    if(Input.mousePagePOS[1] > cheight){return false;}
    return true;
  }
  /**-------------------------------------------------------------------------
   * > Check whether the given key id is triggered
   * @param {number} key_id - id of the key
   * @returns {boolean}
   */
  static isTriggered(key_id){
    return this.keystate_trigger[key_id];
  }
  /**-------------------------------------------------------------------------
   * > Check whether the given key id is pressed
   * @param {number} vk - id of the (virtual) key
   * @returns {boolean}
   */
  static isPressed(vk){
    return this.keystate_press[vk];
  }
  /**-------------------------------------------------------------------------
   * > Check whether mouse moved
   */
  static get isMouseMoved(){
    return this._mouseMoved;
  }
  /**-------------------------------------------------------------------------
   * > Check whether pointer is inside the app
   */
  static get isPointerInside(){
    return this._pointerInside;
  }
  /**-------------------------------------------------------------------------
   * > Check whether mouse wheel scrolled up
   */
  static isWheelUp(){
    return this.wheelstate == 1;
  }
  /**-------------------------------------------------------------------------
   * > Check whether mouse wheel scrolled down
   */
  static isWheelDown(){
    return this.wheelstate == -1;  
  }
} // class Input