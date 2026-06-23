import { useState, useEffect } from "react";
import "./MultiSelectModal.css";

export default function MultiSelectModal({
    title,
    items,
    onConfirm,
    onCancel,
    confirmText = "Assign Selected",
    searchPlaceholder = "Search...",
    isLoading = false,
    onSearch = null,
    onSearchStart = null
}) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        if (onSearchStart) onSearchStart();
    };

    useEffect(() => {
        if (!onSearch) return;
        const timer = setTimeout(() => {
            onSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const toggleSelection = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selected => selected !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleConfirm = () => {
        onConfirm(selectedIds);
    };

    return (
        <>
            <div className="modal-overlay" onClick={onCancel} />
            <div className="multi-select-modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="ms-header">
                    <h2 className="ms-title">{title}</h2>
                    <button className="btn-close" onClick={onCancel}>✕</button>
                </div>

                <div className="ms-content">
                    <input
                        type="text"
                        className="ms-search"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                            Loading options...
                        </div>
                    ) : items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                            No options available.
                        </div>
                    ) : (
                        <div className="ms-list">
                            {items.map(item => {
                                const isSelected = selectedIds.includes(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className={`ms-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => toggleSelection(item.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            className="ms-item-checkbox"
                                            checked={isSelected}
                                            readOnly
                                        />
                                        <div className="ms-item-details">
                                            <div className="ms-item-title">
                                                {item.title}
                                                {item.badge && (
                                                    <span className={`role-badge role-${item.badge}`} style={{ marginLeft: '10px', fontSize: '0.7rem' }}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                            {item.subtitle && (
                                                <div className="ms-item-subtitle">{item.subtitle}</div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="ms-footer">
                    <button className="btn-cancel" onClick={onCancel}>Cancel</button>
                    <button
                        className="btn-primary"
                        onClick={handleConfirm}
                        disabled={selectedIds.length === 0 || isLoading}
                        style={{ opacity: (selectedIds.length === 0 || isLoading) ? 0.6 : 1 }}
                    >
                        {isLoading ? "Assigning..." : confirmText} {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                    </button>
                </div>
            </div>
        </>
    );
}
