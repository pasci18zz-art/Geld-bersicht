package de.pasci.geld;

public class TileExpense extends ActionTile {
    @Override String uri() { return "geld://ausgabe"; }
    @Override int iconRes() { return R.drawable.ic_tile_expense; }
    @Override int labelRes() { return R.string.sc_expense_short; }
}
