import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown, Search, FilterX, MousePointer2, RefreshCw, ListFilter, Check, X } from 'lucide-react';

/**
 * DataTable Component
 * @param {Array} data - Array of objects to display
 * @param {Array} columns - Column definitions: { header: string, key: string, sortable: boolean, filterable: boolean, render: function }
 * @param {string} emptyMessage - Message to show when no data
 */
const DataTable = ({ data = [], columns = [], emptyMessage = 'No records found.' }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [checklistFilters, setChecklistFilters] = useState({});
  const [menuConfig, setMenuConfig] = useState({ visible: false, x: 0, y: 0, colKey: null });
  const [activeChecklist, setActiveChecklist] = useState(null); // Key of the column currently showing checklist
  const containerRef = useRef(null);

  // Generate Unique Values for each column (Memoized)
  const uniqueValuesMap = useMemo(() => {
    const map = {};
    columns.forEach(col => {
      if (col.filterable !== false) {
        const values = [...new Set(data.map(row => row[col.key]))]
          .filter(v => v !== null && v !== undefined && v !== '')
          .sort();
        map[col.key] = values;
      }
    });
    return map;
  }, [data, columns]);

  // Handle Sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      setSortConfig({ key: null, direction: 'asc' });
      return;
    }
    setSortConfig({ key, direction });
  };

  // Handle Filter Change (Text)
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle Checklist Change
  const toggleChecklistItem = (colKey, val) => {
    setChecklistFilters(prev => {
      const current = prev[colKey] || [];
      const next = current.includes(val) 
        ? current.filter(v => v !== val)
        : [...current, val];
      return { ...prev, [colKey]: next.length > 0 ? next : undefined };
    });
  };

  const selectAllInChecklist = (colKey) => {
    setChecklistFilters(prev => ({ ...prev, [colKey]: undefined }));
  };

  // Context Menu Handlers
  const handleContextMenu = (e, colKey) => {
    e.preventDefault();
    setMenuConfig({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      colKey: colKey
    });
  };

  const clearFilter = () => {
    if (menuConfig.colKey) {
      handleFilterChange(menuConfig.colKey, '');
      setChecklistFilters(prev => ({ ...prev, [menuConfig.colKey]: undefined }));
    }
    setMenuConfig({ ...menuConfig, visible: false });
  };

  const clearAllFilters = () => {
    setFilters({});
    setChecklistFilters({});
    setSortConfig({ key: null, direction: 'asc' });
    setMenuConfig({ ...menuConfig, visible: false });
  };

  // Close menus on click outside
  useEffect(() => {
    const handleClick = () => {
      setMenuConfig(prev => ({ ...prev, visible: false }));
      setActiveChecklist(null);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Process Data (Filter and Sort)
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply Text Filters
    Object.keys(filters).forEach(key => {
      if (!filters[key]) return;
      const filterValue = filters[key].toLowerCase();
      filtered = filtered.filter(row => {
        const cellValue = String(row[key] || '').toLowerCase();
        return cellValue.includes(filterValue);
      });
    });

    // Apply Checklist Filters
    Object.keys(checklistFilters).forEach(key => {
      const selectedArr = checklistFilters[key];
      if (selectedArr && selectedArr.length > 0) {
        filtered = filtered.filter(row => selectedArr.includes(row[key]));
      }
    });

    // Apply Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, filters, checklistFilters, sortConfig]);

  // Calculate Totals for columns with showTotal: true
  const totals = useMemo(() => {
    const result = {};
    columns.forEach(col => {
      if (col.showTotal) {
        if (col.calcTotal) {
          result[col.key] = col.calcTotal(processedData);
        } else {
          result[col.key] = processedData.reduce((acc, row) => acc + (Number(row[col.key]) || 0), 0);
        }
      }
    });
    return result;
  }, [processedData, columns]);

  return (
    <div className="table-container" ref={containerRef}>
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className="datatable-header-cell"
                onContextMenu={(e) => handleContextMenu(e, col.key)}
              >
                <div 
                  className={`datatable-header-content ${sortConfig.key === col.key ? 'datatable-sort-active' : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{ cursor: col.sortable !== false ? 'pointer' : 'default' }}
                >
                  {col.header}
                  {col.sortable !== false && (
                    <span className="datatable-sort-icon">
                      {sortConfig.key === col.key ? (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} />
                      )}
                    </span>
                  )}
                </div>
                
                {col.filterable !== false && (
                  <div className="datatable-filter-row">
                    <input 
                      className="datatable-filter-input"
                      placeholder={`Filter...`}
                      value={filters[col.key] || ''}
                      onChange={(e) => handleFilterChange(col.key, e.target.value)}
                      onContextMenu={(e) => handleContextMenu(e, col.key)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button 
                      className={`checklist-trigger ${checklistFilters[col.key] ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveChecklist(activeChecklist === col.key ? null : col.key);
                      }}
                    >
                      <ListFilter size={14} />
                    </button>

                    {/* Checklist Popover */}
                    {activeChecklist === col.key && (
                      <div className="checklist-popover" onClick={e => e.stopPropagation()}>
                        <div className="checklist-search">
                           <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>SELECT {col.header.toUpperCase()}</p>
                        </div>
                        <div className="checklist-list">
                          {uniqueValuesMap[col.key]?.map((val, vIdx) => (
                            <div 
                              key={vIdx} 
                              className="checklist-item"
                              onClick={() => toggleChecklistItem(col.key, val)}
                            >
                              <input 
                                type="checkbox" 
                                checked={checklistFilters[col.key]?.includes(val) || !checklistFilters[col.key]} 
                                readOnly 
                              />
                              <span>{col.render ? col.render(val, {}) : String(val)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="checklist-footer">
                          <button 
                            className="btn btn-secondary btn-tiny"
                            onClick={() => selectAllInChecklist(col.key)}
                          >
                            All
                          </button>
                          <button 
                            className="btn btn-primary btn-tiny"
                            onClick={() => setActiveChecklist(null)}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {processedData.length > 0 ? (
            <>
              {processedData.map((row, rowIdx) => (
                <tr key={row.id || rowIdx} className="datatable-data-row">
                  {columns.map((col, colIdx) => (
                    <td 
                      key={colIdx}
                      onContextMenu={(e) => handleContextMenu(e, col.key)}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="datatable-filler-row">
                <td colSpan={columns.length} style={{ padding: 0, border: 'none', height: '100%' }}></td>
              </tr>
            </>
          ) : (
            <tr>
              <td colSpan={columns.length} className="datatable-empty-state">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
        {columns.some(c => c.showTotal) && processedData.length > 0 && (
          <tfoot>
            <tr className="datatable-total-row">
              {columns.map((col, idx) => (
                <td key={idx}>
                  {col.showTotal ? (
                    col.renderTotal ? col.renderTotal(totals[col.key]) : (
                      col.render ? col.render(totals[col.key], {}) : totals[col.key]
                    )
                  ) : ''}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>

      {/* Context Menu */}
      {menuConfig.visible && (
        <div 
          className="context-menu" 
          style={{ top: menuConfig.y, left: menuConfig.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {menuConfig.colKey && (filters[menuConfig.colKey] || checklistFilters[menuConfig.colKey]) && (
            <div className="context-menu-item" onClick={clearFilter}>
              <FilterX size={14} /> Clear This Filter
            </div>
          )}
          <div className="context-menu-item" onClick={clearAllFilters}>
            <RefreshCw size={14} /> Reset All Table Filters
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item" style={{ opacity: 0.5, cursor: 'default' }}>
            <MousePointer2 size={14} /> Table Actions
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
