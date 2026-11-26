import { useEffect, useMemo, useRef, useState } from "react";
import { FolderOpen, Tag, Ruler, Plus, Search, Pencil, Trash2, X, Save, Loader2 } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import "../../assets/styles/common/MasterDataManager.css";

const CONFIG = {
  category: { title: "Categories", Icon: FolderOpen, name: "Category name" },
  brand: { title: "Brands", Icon: Tag, name: "Brand name" },
  unit: { title: "Units", Icon: Ruler, name: "Unit name" },
};

export default function MasterDataManager({ type, items = [], onClose, onCreate, onUpdate, onDelete }) {
  const config = CONFIG[type] || CONFIG.category;
  const Icon = config.Icon;
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    setSearch("");
    setEditing(null);
  }, [type]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      String(item.name || "").toLowerCase().includes(term) ||
      String(item.shortName || "").toLowerCase().includes(term)
    );
  }, [items, search]);

  const getId = (item) => item.categoryId ?? item.brandId ?? item.unitId;

  const startCreate = () => {
    setEditing({ id: null });
    setName("");
    setShortName("");
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  const startEdit = (item) => {
    setEditing({ id: getId(item) });
    setName(item.name || "");
    setShortName(item.shortName || "");
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  const cancelEdit = () => {
    setEditing(null);
    setName("");
    setShortName("");
  };

  const save = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const data = { name: name.trim(), isActive: true };
      if (type === "unit") data.shortName = shortName.trim();

      if (editing?.id == null) await onCreate(data);
      else await onUpdate(editing.id, data);
      cancelEdit();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDelete(getId(deleteTarget));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="master-manager-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <div className="master-manager" role="dialog" aria-modal="true">
          <header className="master-manager-header">
            <div className="master-manager-title">
              <span className="master-manager-icon"><Icon size={20} /></span>
              <div><span>Master Data</span><h2>Manage {config.title}</h2></div>
            </div>
            <button type="button" className="master-manager-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
          </header>

          <div className="master-manager-toolbar">
            <div className="master-manager-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${config.title.toLowerCase()}...`} /></div>
            <button type="button" className="btn btn-primary" onClick={startCreate}><Plus size={16} /> Add {type}</button>
          </div>

          {editing && (
            <form className="master-manager-editor" onSubmit={save}>
              <div className="master-manager-editor-fields">
                <label>{config.name}<input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} required /></label>
                {type === "unit" && <label>Short name<input value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="e.g. kg" /></label>}
              </div>
              <div className="master-manager-editor-actions">
                <button type="button" className="btn btn-outline" onClick={cancelEdit} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={16} className="spinning" /> : <Save size={16} />} Save</button>
              </div>
            </form>
          )}

          <div className="master-manager-list">
            {filteredItems.length === 0 ? (
              <div className="master-manager-empty">No {config.title.toLowerCase()} found.</div>
            ) : filteredItems.map((item) => (
              <div className="master-manager-row" key={getId(item)}>
                <div className="master-manager-row-info">
                  <strong>{item.name}</strong>
                  {type === "unit" && item.shortName && <span>{item.shortName}</span>}
                  {item.isActive === false && <span className="master-manager-inactive">Inactive</span>}
                </div>
                <div className="master-manager-row-actions">
                  <button type="button" onClick={() => startEdit(item)} title="Edit"><Pencil size={15} /></button>
                  <button type="button" className="danger" onClick={() => setDeleteTarget(item)} title="Delete"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={`Delete ${type}?`}
        message={`Delete “${deleteTarget?.name || "this item"}”? The system will deactivate it if it is already used.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
