import React from "react";
import { Entity } from "../context/EntityContext.js";
import { ChevronDown, Building2, Users, Network } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface EntitySelectorProps {
  entities: Entity[];
  selectedEntity: Entity | null;
  onSelect: (entity: Entity) => void;
}

const getEntityIcon = (type: Entity["type"]) => {
  switch (type) {
    case "company":
      return <Building2 className="h-4 w-4 mr-2" />;
    case "department":
      return <Users className="h-4 w-4 mr-2" />;
    case "team":
      return <Network className="h-4 w-4 mr-2" />;
    default:
      return <Building2 className="h-4 w-4 mr-2" />;
  }
};

export const EntitySelector: React.FC<EntitySelectorProps> = ({
  entities,
  selectedEntity,
  onSelect,
}) => {
  if (!selectedEntity) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center space-x-2 border border-gray-300 bg-white hover:bg-gray-50"
        >
          <div className="flex items-center">
            {getEntityIcon(selectedEntity.type)}
            <span className="font-medium">{selectedEntity.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {entities.map((entity) => (
          <DropdownMenuItem
            key={entity.id}
            className="flex items-center"
            onClick={() => onSelect(entity)}
          >
            {getEntityIcon(entity.type)}
            <div>
              <div className="font-medium">{entity.name}</div>
              <div className="text-xs text-gray-500">
                {entity.currency} • {entity.timezone}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        <div className="border-t my-1"></div>
        <DropdownMenuItem className="text-blue-600 hover:text-blue-700">
          + Add new entity
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
