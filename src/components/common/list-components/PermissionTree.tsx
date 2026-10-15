import React from 'react';
import { Checkbox } from './Checkbox';
import { PermissionModule } from '../../../types/accessProfile';

interface PermissionTreeProps {
  modules: PermissionModule[];
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  readOnly?: boolean;
}

export const PermissionTree: React.FC<PermissionTreeProps> = ({
  modules,
  selectedPermissions,
  onChange,
  readOnly = false,
}) => {
  const togglePermission = (permId: string) => {
    if (readOnly) return;
    if (selectedPermissions.includes(permId)) {
      onChange(selectedPermissions.filter((id) => id !== permId));
    } else {
      onChange([...selectedPermissions, permId]);
    }
  };

  const toggleModule = (module: PermissionModule) => {
    if (readOnly) return;
    const modulePermIds = module.permissions.map((p) => p.id);
    const allModuleSelected = modulePermIds.every((id) =>
      selectedPermissions.includes(id)
    );

    if (allModuleSelected) {
      // Unselect all in module
      onChange(selectedPermissions.filter((id) => !modulePermIds.includes(id)));
    } else {
      // Select all in module
      const unique = Array.from(
        new Set([...selectedPermissions, ...modulePermIds])
      );
      onChange(unique);
    }
  };

  return (
    <div className="space-y-3">
      {modules.map((module) => {
        const modulePermIds = module.permissions.map((p) => p.id);
        const selectedInModule = modulePermIds.filter((id) =>
          selectedPermissions.includes(id)
        );
        const allSelected =
          modulePermIds.length > 0 &&
          selectedInModule.length === modulePermIds.length;
        const indeterminate =
          selectedInModule.length > 0 && !allSelected;

        return (
          <div
            key={module.id}
            className="rounded-xl border border-[#E9E3D8] bg-white overflow-hidden"
          >
            {/* Module Parent Row */}
            <div
              onClick={() => toggleModule(module)}
              className={`p-3.5 flex items-center justify-between gap-3 bg-[#FAF6F0]/60 border-b border-[#E9E3D8] cursor-pointer transition-colors ${
                readOnly ? 'cursor-default' : 'hover:bg-[#FAF6F0]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Checkbox
                  checked={allSelected}
                  indeterminate={indeterminate}
                  onChange={() => toggleModule(module)}
                  readOnly={readOnly}
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#1A1033] block">
                    {module.name}
                  </span>
                  {module.description && (
                    <span className="text-[11px] text-[#6B6B76] block truncate">
                      {module.description}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#6B6B76] px-2 py-0.5 rounded-full bg-white border border-[#E9E3D8] flex-shrink-0">
                {selectedInModule.length}/{modulePermIds.length}
              </span>
            </div>

            {/* Child Permissions */}
            <div className="p-3 pl-10 space-y-2.5 bg-white">
              {module.permissions.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    onClick={(e) => {
                      e.preventDefault();
                      togglePermission(perm.id);
                    }}
                    className={`flex items-start gap-2.5 cursor-pointer text-xs select-none ${
                      readOnly ? 'cursor-default' : 'hover:text-[#1A1033]'
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onChange={() => togglePermission(perm.id)}
                      readOnly={readOnly}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-[#24152F] block">
                        {perm.label}
                      </span>
                      {perm.description && (
                        <span className="text-[10px] text-[#6B6B76] block">
                          {perm.description}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
