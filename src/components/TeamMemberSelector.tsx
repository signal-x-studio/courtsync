import { useState } from 'react';
import type { useTeamCoordination } from '../hooks/useTeamCoordination';

interface TeamMemberSelectorProps {
  teamCoordination: ReturnType<typeof useTeamCoordination>;
}

export const TeamMemberSelector = ({ teamCoordination }: TeamMemberSelectorProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      teamCoordination.addMember(newMemberName.trim());
      setNewMemberName('');
      setShowAddForm(false);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (teamCoordination.members.length > 1) {
      if (confirm(`Remove ${teamCoordination.getMember(memberId)?.name}?`)) {
        teamCoordination.removeMember(memberId);
      }
    } else {
      alert('Cannot remove the last team member');
    }
  };

  return (
    <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#f8f8f9]">Team Members</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463] transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <div className="mb-4 p-3 rounded bg-[#454654] border border-[#525463]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
              placeholder="Member name"
              className="flex-1 px-3 py-2 text-sm rounded bg-[#3b3c48] text-[#f8f8f9] border border-[#525463] focus:border-[#eab308] focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleAddMember}
              className="px-3 py-2 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-2">
        {teamCoordination.members.map((member) => {
          const isCurrent = teamCoordination.currentMemberId === member.id;
          const isEditing = editingMemberId === member.id;
          const assignmentsCount = Array.from(teamCoordination.assignments.values())
            .filter(id => id === member.id).length;

          return (
            <div
              key={member.id}
              className={`flex items-center justify-between p-3 rounded border transition-colors ${
                isCurrent
                  ? 'border-[#eab308] bg-[#eab308]/10'
                  : 'border-[#454654] bg-[#3b3c48]'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Color Indicator */}
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: member.color }}
                />
                
                {/* Member Name */}
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={member.name}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== member.name) {
                        teamCoordination.updateMember(member.id, { name: e.target.value.trim() });
                      }
                      setEditingMemberId(null);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    className="flex-1 px-2 py-1 text-sm rounded bg-[#454654] text-[#f8f8f9] border border-[#525463] focus:border-[#eab308] focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={() => teamCoordination.setCurrentMemberId(member.id)}
                      className={`text-sm font-medium truncate ${
                        isCurrent ? 'text-[#facc15]' : 'text-[#f8f8f9] hover:text-[#facc15]'
                      } transition-colors`}
                    >
                      {member.name}
                    </button>
                    {isCurrent && (
                      <span className="text-[10px] text-[#9fa2ab]">(Active)</span>
                    )}
                    {assignmentsCount > 0 && (
                      <span className="text-[10px] text-[#9fa2ab]">
                        ({assignmentsCount} team{assignmentsCount !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isEditing && (
                  <button
                    onClick={() => setEditingMemberId(member.id)}
                    className="px-2 py-1 text-xs text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
                    title="Edit name"
                  >
                    ✏️
                  </button>
                )}
                {teamCoordination.members.length > 1 && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="px-2 py-1 text-xs text-[#9fa2ab] hover:text-red-400 transition-colors"
                    title="Remove member"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

