// components/grn/GRNComments.jsx
import FormTextarea from "../common/FormTextarea";

function GRNComments({ value, onChange }) {
  return (
    <div className="grn-comments-section">
      <FormTextarea
        label="Comments"
        name="comments"
        value={value}
        onChange={onChange}
        placeholder="Enter any additional comments..."
        rows={3}
      />
    </div>
  );
}

export default GRNComments;