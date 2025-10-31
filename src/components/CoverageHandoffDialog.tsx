import { useState } from 'react';
import type { useTeamCoordination } from '../hooks/useTeamCoordination';

interface CoverageHandoffDialogProps {
  teamId: string;
  fromMemberId: string;
  teamCoordination: ReturnType<typeof useTeamCoordination>;
  onClose: () => void;
  onHandoff: (toMemberId: string, note: string) => void;
}

export const CoverageHandoffDialog = ({
  teamId,
  fromMemberId,
  teamCoordination,
  onClose,
  onHandoff,
}: CoverageHandoffDialogProps) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [handoffNote, setHandoffNote] = useState('');

  const fromMember = teamCoordination.getMember(fromMemberId);
  const availableMembers = teamCoordination.members.filter(m => m.id !== fromMemberId);

  const handleSubmit = () => {
    if (selectedMemberId) {
      onHandoff(selectedMemberId, handoffNote);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#3b3c48] border border-[#454654] rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#f8f8f9]">Transfer Coverage</h3>
          <button
            onClick={onClose}
            className="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#9fa2ab] mb-1 block">Team</label>
            <div className="text-sm text-[#f8f8f9]">Team {teamId}</div>
          </div>

          <div>
            <label className="text-xs text-[#9fa2ab] mb-1 block">From</label>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: fromMember?.color }}
              />
              <span className="text-sm text-[#f8f8f9]">{fromMember?.name || 'Unknown'}</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#9fa2ab] mb-1 block">Transfer To</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded bg-[#454654] text-[#f8f8f9] border border-[#525463] focus:border-[#eab308] focus:outline-none"
            >
              <option value="">Select team member...</option>
              {availableMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-[#9fa2ab] mb-1 block">Notes (optional)</label>
            <textarea
              value={handoffNote}
              onChange={(e) => setHandoffNote(e.target.value)}
              placeholder="Add any notes about this handoff..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded bg-[#454654] text-[#f8f8f9] border border-[#525463] focus:border-[#eab308] focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSubmit}
            disabled={!selectedMemberId}
            className="flex-1 px-3 py-2 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Transfer
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

