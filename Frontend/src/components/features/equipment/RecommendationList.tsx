// src/components/features/equipment/RecommendationList.tsx
import { Equipment, EquipmentRecommendation } from "@/types/equipment";
import { Badge, Button } from "@mui/material";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";

interface RecommendationListProps {
  recommendation: EquipmentRecommendation;
}

const RecommendationList = ({ recommendation }: RecommendationListProps) => {
  // Helper function to safely access equipment properties
  const getEquipmentDetails = (equipment: string | Equipment) => {
    if (typeof equipment === "string") {
      return {
        manufacturer: "Loading...",
        model: equipment,
        imageUrl: undefined,
        typicalUseCase: "Details loading...",
      };
    }
    return equipment;
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">
        Recommended Equipment for Design
      </h3>
      <div className="space-y-6">
        {recommendation.recommendations.map((item, index) => {
          const recommended = getEquipmentDetails(item.recommendedEquipment);

          return (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium capitalize">{item.category}</h4>
                  <p className="text-sm text-gray-500 mb-2">
                    {item.justification}
                  </p>
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge>Qty: {item.quantity}</Badge>
                    <Badge>Placement: {item.placement}</Badge>
                  </div>
                </div>
                <Button>
                  <ShoppingCartIcon className="h-4 w-4 mr-1" />
                  Add to Cart
                </Button>
              </div>

              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">Recommended:</h5>
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex items-start">
                    {recommended.imageUrl && (
                      <img
                        src={recommended.imageUrl}
                        alt={recommended.model}
                        className="h-16 w-16 object-contain mr-3"
                      />
                    )}
                    <div>
                      <h6 className="font-medium">
                        {recommended.manufacturer} {recommended.model}
                      </h6>
                      <p className="text-sm text-gray-600">
                        {recommended.typicalUseCase}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {item.alternatives && item.alternatives.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium mb-2">Alternatives:</h5>
                  <div className="space-y-3">
                    {item.alternatives.map((alt, altIndex) => {
                      const alternative = getEquipmentDetails(alt);
                      return (
                        <div
                          key={altIndex}
                          className="bg-gray-50 p-3 rounded-md flex items-start"
                        >
                          {alternative.imageUrl && (
                            <img
                              src={alternative.imageUrl}
                              alt={alternative.model}
                              className="h-12 w-12 object-contain mr-3"
                            />
                          )}
                          <div>
                            <h6 className="font-medium">
                              {alternative.manufacturer} {alternative.model}
                            </h6>
                            <p className="text-sm text-gray-600">
                              {alternative.typicalUseCase}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationList;
