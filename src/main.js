/// <reference path="refs.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var G = (function () {
    function G() {
    }
    G.SCREEN_WIDTH = 500;
    G.SCREEN_HEIGHT = 500;
    G.MAP_W = 500;
    G.MAP_H = 500;
    return G;
})();
var MainState = (function (_super) {
    __extends(MainState, _super);
    function MainState() {
        _super.apply(this, arguments);
    }
    MainState.prototype.preload = function () {
        // fw, fh, num frames,
        this.load.spritesheet("default", "assets/default.png", 32, 32);
    };
    MainState.prototype.init = function () {
        G.game.stage.backgroundColor = "#356b92";
    };
    MainState.prototype.create = function () {
        G.game.world.setBounds(0, 0, G.MAP_W, G.MAP_H);
        G.game.add.sprite(25, 25, "default");
    };
    return MainState;
})(Phaser.State);
var Game = (function () {
    function Game() {
        this.state = new MainState();
        G.game = new Phaser.Game(G.SCREEN_WIDTH, G.SCREEN_HEIGHT, Phaser.WEBGL, "main", this.state);
    }
    return Game;
})();
new Game();
