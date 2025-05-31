import type React from "react"

type GeneralRulesSectionProps = {}

const GeneralRulesSection: React.FC<GeneralRulesSectionProps> = () => {
  return (
    <div className="bg-[#e6f9ff] p-4 rounded-md shadow-md">
      <h2 className="text-xl font-semibold text-[#33CCFF] mb-2">General Rules</h2>
      <ul className="list-disc pl-5">
        <li>
          <p className="text-gray-700">All participants must adhere to the code of conduct.</p>
        </li>
        <li>
          <p className="text-gray-700">Respect other participants and organizers.</p>
        </li>
        <li>
          <p className="text-gray-700">Follow the instructions provided by the organizers.</p>
        </li>
        <li>
          <p className="text-gray-700">Any form of harassment or discrimination will not be tolerated.</p>
        </li>
      </ul>
      <div className="border-t border-[#33CCFF] mt-4 pt-4">
        <p className="text-sm text-gray-500">These rules are subject to change at any time.</p>
      </div>
    </div>
  )
}

export default GeneralRulesSection
