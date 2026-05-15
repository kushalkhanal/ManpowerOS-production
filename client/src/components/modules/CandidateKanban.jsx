import DocumentCard from './CandidateDocumentCard';

const CandidateKanban = ({ columns, onAdd, onEdit, onQuickComplete, candidateId, onRefresh, extraActions }) => {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-start gap-3 min-w-max">
        {(columns || []).map((column) => (
          <DocumentCard
            key={column.id}
            column={column}
            onAdd={onAdd}
            onEdit={onEdit}
            onQuickComplete={onQuickComplete}
            candidateId={candidateId}
            onRefresh={onRefresh}
            extraActions={extraActions?.[column.id]}
          />
        ))}
      </div>
    </div>
  );
};

export default CandidateKanban;
