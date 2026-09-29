const TAB_ID = "fv-tv-tab";
const PAGE_STYLE_ID = "fv-tv-dock-style";

/** Remove leftover W-tab inject from older builds. Open/min layout lives in mount + page-layout. */
export function teardownTvDock() {
  const tab = document.getElementById(TAB_ID);
  if (tab) tab.remove();
  const css = document.getElementById(PAGE_STYLE_ID);
  if (css) css.remove();
}
