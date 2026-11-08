package de.pasci.geld;

public class TilePay extends ActionTile {
    @Override String uri() { return "geld://zahlung"; }
    @Override int iconRes() { return R.drawable.ic_tile_pay; }
    @Override int labelRes() { return R.string.sc_pay_short; }
}
