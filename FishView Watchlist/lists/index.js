import { notBuilt } from "../shared/placeholder.js";

export {
  LIST_CAP,
  STOCK_CAP,
  BATCH_CAP,
  LABELS,
  LABEL_COLOR,
  defaultBook,
  labelTitle,
  labelCounts,
  parseSymbol,
  canonicalExchange,
  normalizeBook,
  loadBook,
  saveBook,
  activeList,
  visibleStocks,
  setActive,
  createList,
  renameList,
  deleteList,
  addStock,
  addStocks,
  createListWithStocks,
  removeStock,
  setLabel,
  nextLabel,
  moveStock,
  copyStock,
  allLabelsSelected,
  listsByName,
  FILTER_KEYS,
  HEADER_DOTS,
  toggleLabelOn,
  restoreAllLabels,
  setSort,
  cleanListName,
} from "./book.js";

export { backupJson, backupFileName, parseBackupText, restoreBackupBook } from "./backup.js";

export { setLabelsOn, removeStocks, copyStocks, moveStocks, createDestList, otherLists } from "./bulk.js";

export function placeholderMessage() {
  return notBuilt(2);
}
