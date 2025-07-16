import React from "react";
import GoalWizard from "../../features/goals/components/creation/GoalWizard";

const CreateGoalPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-theme py-8">
      <GoalWizard />
    </div>
  );
};

export default CreateGoalPage;
