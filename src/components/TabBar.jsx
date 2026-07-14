import React from 'react';
import { X } from 'lucide-react';
import { TAB_REGISTRY } from '../data/registry';

const TabBar = ({ tabIds, activeTabId, onSelect, onClose }) => {
  return (
    <div className="tab-bar">
      {tabIds.map((id) => {
        const metadata = TAB_REGISTRY[id];
        if (!metadata) return null;
        
        return (
          <div 
            key={id}
            className={`tab-item ${activeTabId === id ? 'active' : ''}`}
            onClick={() => onSelect(id)}
          >

            <span>{metadata.label}</span>
            <button 
              className="tab-close" 
              onClick={(e) => {
                e.stopPropagation();
                onClose(id);
              }}
            >
              <X size={10} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default TabBar;
