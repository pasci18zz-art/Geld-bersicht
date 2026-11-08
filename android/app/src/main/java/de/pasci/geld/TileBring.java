package de.pasci.geld;

public class TileBring extends ActionTile {
    @Override String uri() { return "geld://mitbringen"; }
    @Override int iconRes() { return R.drawable.ic_tile_bring; }
    @Override int labelRes() { return R.string.sc_bring_short; }
}
