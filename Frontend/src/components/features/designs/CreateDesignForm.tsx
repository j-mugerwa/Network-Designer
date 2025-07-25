// src/components/features/network-design/CreateDesignForm.tsx
import { useState, useCallback, useEffect } from "react";
import { useAppDispatch } from "@/store/store";
import { createDesign, updateDesign } from "@/store/slices/networkDesignSlice";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  FormGroup,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { GridItem } from "@/components/layout/GridItem";
import { CreateDesignPayload, NetworkSegment } from "@/types/networkDesign";

// Define constants for reusable values
const NETWORK_ISSUES = [
  "bandwidth",
  "latency",
  "security",
  "reliability",
  "scalability",
  "management",
] as const;

const ON_PREMISE_SERVICES = [
  "erp",
  "crm",
  "fileserver",
  "email",
  "database",
] as const;

const CLOUD_SERVICES = ["saas", "iaas", "paas", "storage", "backup"] as const;

const NETWORK_SERVICES = [
  "dhcp",
  "dns",
  "vpn",
  "proxy",
  "load-balancing",
] as const;

const USER_RANGES = ["1-50", "51-200", "201-500", "500+"] as const;
const TOPOLOGIES = ["star", "bus", "ring", "mesh", "hybrid", "other"] as const;
const SEGMENT_TYPES = [
  "department",
  "function",
  "security",
  "guest",
  "iot",
] as const;
const BANDWIDTH_PRIORITIES = ["low", "medium", "high", "critical"] as const;
const ISOLATION_LEVELS = ["none", "vlans", "physical", "full"] as const;
const FIREWALL_LEVELS = ["none", "basic", "enterprise", "utm"] as const;
const REMOTE_ACCESS_METHODS = ["none", "vpn", "rdp", "citrix"] as const;
const BUDGET_RANGES = ["low", "medium", "high", "unlimited"] as const;
const PRIVATE_IP_RANGES = [
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
] as const;

// Define types based on the constants
type NetworkIssue = (typeof NETWORK_ISSUES)[number];
type OnPremiseService = (typeof ON_PREMISE_SERVICES)[number];
type CloudService = (typeof CLOUD_SERVICES)[number];
type NetworkService = (typeof NETWORK_SERVICES)[number];

const DEFAULT_SEGMENT: NetworkSegment = {
  name: "",
  type: "department",
  users: 1,
  bandwidthPriority: "medium",
  isolationLevel: "none",
};

const INITIAL_FORM_DATA: CreateDesignPayload = {
  designName: "",
  description: "",
  isExistingNetwork: false,
  existingNetworkDetails: {
    currentTopology: undefined,
    currentIssues: [],
    currentIPScheme: "",
    currentDevices: [],
  },
  requirements: {
    totalUsers: "1-50",
    wiredUsers: 0,
    wirelessUsers: 0,
    networkSegmentation: false,
    segments: [],
    bandwidth: {
      upload: 10,
      download: 10,
      symmetric: false,
    },
    services: {
      cloud: [],
      onPremise: [],
      network: [],
    },
    ipScheme: {
      private: "192.168.0.0/16",
      publicIPs: 0,
      ipv6: false,
    },
    securityRequirements: {
      firewall: "basic",
      ids: false,
      ips: false,
      contentFiltering: false,
      remoteAccess: "none",
    },
    redundancy: {
      internet: false,
      coreSwitching: false,
      power: false,
    },
    budgetRange: "medium",
  },
};

interface CreateDesignFormProps {
  onSuccess?: (designId: string) => void;
  initialData?: CreateDesignPayload & { id?: string };
  isEditMode?: boolean;
}

export const CreateDesignForm = ({
  onSuccess,
  initialData,
  isEditMode = false,
}: CreateDesignFormProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [error, setError] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | false>(
    "basic"
  );
  const [formData, setFormData] =
    useState<CreateDesignPayload>(INITIAL_FORM_DATA);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Initialize form with initialData if in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        designName: initialData.designName,
        description: initialData.description,
        isExistingNetwork: initialData.isExistingNetwork,
        existingNetworkDetails: initialData.existingNetworkDetails
          ? { ...initialData.existingNetworkDetails }
          : INITIAL_FORM_DATA.existingNetworkDetails,
        requirements: {
          ...INITIAL_FORM_DATA.requirements,
          ...initialData.requirements,
          segments: initialData.requirements?.segments
            ? [...initialData.requirements.segments]
            : [],
        },
      });
    }
  }, [isEditMode, initialData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleNestedChange = useCallback((path: string, value: any) => {
    setFormData((prev) => {
      const newState = { ...prev };
      const pathParts = path.split(".");
      let current: any = newState;

      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }

      current[pathParts[pathParts.length - 1]] = value;
      return newState;
    });
  }, []);

  const handleArrayChange = useCallback(
    (path: string, value: string, checked: boolean) => {
      setFormData((prev) => {
        const newState = JSON.parse(JSON.stringify(prev));
        const pathParts = path.split(".");
        let current: any = newState;

        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) {
            current[pathParts[i]] = {};
          }
          current = current[pathParts[i]];
        }

        const array = current[pathParts[pathParts.length - 1]] || [];
        current[pathParts[pathParts.length - 1]] = checked
          ? [...array, value]
          : array.filter((item: string) => item !== value);

        return newState;
      });
    },
    []
  );

  const handleSegmentChange = useCallback(
    (index: number, field: keyof NetworkSegment, value: string | number) => {
      setFormData((prev) => {
        const currentRequirements = prev.requirements || {};
        const currentSegments = currentRequirements.segments || [];
        const newSegments = [...currentSegments];

        newSegments[index] = { ...newSegments[index], [field]: value };

        return {
          ...prev,
          requirements: {
            ...currentRequirements,
            segments: newSegments,
          },
        };
      });
    },
    []
  );

  const addSegment = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        segments: [
          ...(prev.requirements?.segments || []),
          { ...DEFAULT_SEGMENT },
        ],
      },
    }));
  }, []);

  const removeSegment = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        segments:
          prev.requirements?.segments?.filter((_, i) => i !== index) || [],
      },
    }));
  }, []);

  const handleAccordionChange = useCallback(
    (section: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedSection(isExpanded ? section : false);
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.designName.trim()) {
      setError("Design name is required");
      setSnackbarOpen(true);
      return;
    }

    try {
      const payload: CreateDesignPayload = {
        ...formData,
        existingNetworkDetails: formData.isExistingNetwork
          ? {
              ...formData.existingNetworkDetails,
              currentTopology:
                formData.existingNetworkDetails?.currentTopology || undefined,
              currentIssues:
                formData.existingNetworkDetails?.currentIssues || [],
            }
          : undefined,
      };

      if (isEditMode && initialData?.id) {
        await dispatch(
          updateDesign({
            id: initialData.id,
            designData: payload,
          })
        );
        router.push("/designs"); // Redirect to designs dashboard after update
      } else {
        await dispatch(createDesign(payload));
        router.push("/designs"); // Redirect to designs dashboard after creation
      }
    } catch (err: any) {
      console.error("Failed to save design:", err);
      setError(err.message || "Failed to save design. Please try again.");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const submitButtonText = isEditMode
    ? "Update Network Design"
    : "Create Network Design";

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {isEditMode ? "Edit Network Design" : "Create New Network Design"}
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <Accordion
            expanded={expandedSection === "basic"}
            onChange={handleAccordionChange("basic")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Basic Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <GridItem sx={{ flex: "1 1 300px" }}>
                  <TextField
                    fullWidth
                    label="Design Name *"
                    name="designName"
                    value={formData.designName}
                    onChange={handleChange}
                    margin="normal"
                    required
                    inputProps={{ maxLength: 100 }}
                  />
                </GridItem>
                <GridItem sx={{ flex: "1 1 300px" }}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    margin="normal"
                    multiline
                    rows={2}
                    inputProps={{ maxLength: 500 }}
                  />
                </GridItem>
                <GridItem sx={{ width: "100%" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isExistingNetwork || false}
                        onChange={(e) =>
                          handleNestedChange(
                            "isExistingNetwork",
                            e.target.checked
                          )
                        }
                        name="isExistingNetwork"
                      />
                    }
                    label="This is an existing network"
                  />
                </GridItem>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Existing Network Details (Conditional) */}
          {formData.isExistingNetwork && (
            <Accordion
              expanded={expandedSection === "existing"}
              onChange={handleAccordionChange("existing")}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Existing Network Details</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  <GridItem sx={{ flex: "1 1 300px" }}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Current Topology</InputLabel>
                      <Select
                        value={
                          formData.existingNetworkDetails?.currentTopology || ""
                        }
                        onChange={(e) =>
                          handleNestedChange(
                            "existingNetworkDetails.currentTopology",
                            e.target.value || undefined
                          )
                        }
                        label="Current Topology"
                      >
                        <MenuItem value="">Select Topology</MenuItem>
                        {TOPOLOGIES.map((topology) => (
                          <MenuItem key={topology} value={topology}>
                            {topology.charAt(0).toUpperCase() +
                              topology.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>
                  <GridItem sx={{ flex: "1 1 300px" }}>
                    <TextField
                      fullWidth
                      label="Current IP Scheme"
                      value={
                        formData.existingNetworkDetails?.currentIPScheme || ""
                      }
                      onChange={(e) =>
                        handleNestedChange(
                          "existingNetworkDetails.currentIPScheme",
                          e.target.value
                        )
                      }
                      margin="normal"
                    />
                  </GridItem>
                  <GridItem sx={{ width: "100%" }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Current Issues
                    </Typography>
                    <FormGroup row>
                      {NETWORK_ISSUES.map((issue) => (
                        <FormControlLabel
                          key={issue}
                          control={
                            <Checkbox
                              checked={
                                formData.existingNetworkDetails?.currentIssues?.includes(
                                  issue
                                ) || false
                              }
                              onChange={(e) =>
                                handleArrayChange(
                                  "existingNetworkDetails.currentIssues",
                                  issue,
                                  e.target.checked
                                )
                              }
                            />
                          }
                          label={issue.charAt(0).toUpperCase() + issue.slice(1)}
                        />
                      ))}
                    </FormGroup>
                  </GridItem>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Network Requirements Section */}
          <Accordion
            expanded={expandedSection === "requirements"}
            onChange={handleAccordionChange("requirements")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Network Requirements</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <GridItem sx={{ flex: "1 1 300px" }}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Total Users *</InputLabel>
                    <Select
                      value={formData.requirements?.totalUsers || "1-50"}
                      onChange={(e) =>
                        handleNestedChange(
                          "requirements.totalUsers",
                          e.target.value
                        )
                      }
                      label="Total Users *"
                      required
                    >
                      {USER_RANGES.map((range) => (
                        <MenuItem key={range} value={range}>
                          {range} users
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>
                <GridItem sx={{ flex: "1 1 200px" }}>
                  <TextField
                    fullWidth
                    label="Wired Users"
                    type="number"
                    value={formData.requirements?.wiredUsers || 0}
                    onChange={(e) =>
                      handleNestedChange(
                        "requirements.wiredUsers",
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    margin="normal"
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </GridItem>
                <GridItem sx={{ flex: "1 1 200px" }}>
                  <TextField
                    fullWidth
                    label="Wireless Users"
                    type="number"
                    value={formData.requirements?.wirelessUsers || 0}
                    onChange={(e) =>
                      handleNestedChange(
                        "requirements.wirelessUsers",
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    margin="normal"
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </GridItem>

                <GridItem sx={{ width: "100%" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          formData.requirements?.networkSegmentation || false
                        }
                        onChange={(e) =>
                          handleNestedChange(
                            "requirements.networkSegmentation",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Network Segmentation Required"
                  />
                </GridItem>

                {formData.requirements?.networkSegmentation && (
                  <GridItem sx={{ width: "100%" }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Network Segments
                    </Typography>
                    {formData.requirements?.segments?.map((segment, index) => (
                      <Box
                        key={index}
                        mb={2}
                        p={2}
                        border={1}
                        borderRadius={1}
                        borderColor="divider"
                      >
                        <Box
                          display="flex"
                          flexWrap="wrap"
                          gap={2}
                          alignItems="center"
                        >
                          <GridItem sx={{ flex: "1 1 200px" }}>
                            <TextField
                              fullWidth
                              label="Segment Name *"
                              value={segment.name}
                              onChange={(e) =>
                                handleSegmentChange(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              required
                            />
                          </GridItem>
                          <GridItem sx={{ flex: "1 1 150px" }}>
                            <FormControl fullWidth>
                              <InputLabel>Type</InputLabel>
                              <Select
                                value={segment.type}
                                onChange={(e) =>
                                  handleSegmentChange(
                                    index,
                                    "type",
                                    e.target.value
                                  )
                                }
                                label="Type"
                              >
                                {SEGMENT_TYPES.map((type) => (
                                  <MenuItem key={type} value={type}>
                                    {type.charAt(0).toUpperCase() +
                                      type.slice(1)}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </GridItem>
                          <GridItem sx={{ flex: "1 1 100px" }}>
                            <TextField
                              fullWidth
                              label="Users *"
                              type="number"
                              value={segment.users}
                              onChange={(e) =>
                                handleSegmentChange(
                                  index,
                                  "users",
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              }
                              InputProps={{ inputProps: { min: 1 } }}
                              required
                            />
                          </GridItem>
                          <GridItem sx={{ flex: "1 1 150px" }}>
                            <FormControl fullWidth>
                              <InputLabel>Bandwidth</InputLabel>
                              <Select
                                value={segment.bandwidthPriority}
                                onChange={(e) =>
                                  handleSegmentChange(
                                    index,
                                    "bandwidthPriority",
                                    e.target.value
                                  )
                                }
                                label="Bandwidth"
                              >
                                {BANDWIDTH_PRIORITIES.map((priority) => (
                                  <MenuItem key={priority} value={priority}>
                                    {priority.charAt(0).toUpperCase() +
                                      priority.slice(1)}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </GridItem>
                          <GridItem sx={{ flex: "1 1 150px" }}>
                            <FormControl fullWidth>
                              <InputLabel>Isolation</InputLabel>
                              <Select
                                value={segment.isolationLevel}
                                onChange={(e) =>
                                  handleSegmentChange(
                                    index,
                                    "isolationLevel",
                                    e.target.value
                                  )
                                }
                                label="Isolation"
                              >
                                {ISOLATION_LEVELS.map((level) => (
                                  <MenuItem key={level} value={level}>
                                    {level.charAt(0).toUpperCase() +
                                      level.slice(1)}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </GridItem>
                          <GridItem sx={{ flex: "0 0 auto" }}>
                            <IconButton
                              onClick={() => removeSegment(index)}
                              color="error"
                            >
                              <RemoveCircleOutlineIcon />
                            </IconButton>
                          </GridItem>
                        </Box>
                      </Box>
                    ))}
                    <Button
                      variant="outlined"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={addSegment}
                    >
                      Add Segment
                    </Button>
                  </GridItem>
                )}

                <GridItem sx={{ width: "100%" }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Bandwidth Requirements
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    <GridItem sx={{ flex: "1 1 200px" }}>
                      <TextField
                        fullWidth
                        label="Upload Speed (Mbps) *"
                        type="number"
                        value={formData.requirements?.bandwidth?.upload || 0}
                        onChange={(e) =>
                          handleNestedChange(
                            "requirements.bandwidth.upload",
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        InputProps={{ inputProps: { min: 1 } }}
                        required
                      />
                    </GridItem>
                    <GridItem sx={{ flex: "1 1 200px" }}>
                      <TextField
                        fullWidth
                        label="Download Speed (Mbps) *"
                        type="number"
                        value={formData.requirements?.bandwidth?.download || 0}
                        onChange={(e) =>
                          handleNestedChange(
                            "requirements.bandwidth.download",
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        InputProps={{ inputProps: { min: 1 } }}
                        required
                      />
                    </GridItem>
                    <GridItem sx={{ flex: "1 1 200px" }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={
                              formData.requirements?.bandwidth?.symmetric ||
                              false
                            }
                            onChange={(e) =>
                              handleNestedChange(
                                "requirements.bandwidth.symmetric",
                                e.target.checked
                              )
                            }
                          />
                        }
                        label="Symmetric Bandwidth"
                      />
                    </GridItem>
                  </Box>
                </GridItem>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Services Section */}
          <Accordion
            expanded={expandedSection === "services"}
            onChange={handleAccordionChange("services")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Services</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <GridItem sx={{ flex: "1 1 300px" }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Cloud Services
                  </Typography>
                  <FormGroup>
                    {CLOUD_SERVICES.map((service) => (
                      <FormControlLabel
                        key={service}
                        control={
                          <Checkbox
                            checked={
                              formData.requirements?.services?.cloud?.includes(
                                service
                              ) || false
                            }
                            onChange={(e) =>
                              handleArrayChange(
                                "requirements.services.cloud",
                                service,
                                e.target.checked
                              )
                            }
                          />
                        }
                        label={service.toUpperCase()}
                      />
                    ))}
                  </FormGroup>
                </GridItem>
                <GridItem sx={{ flex: "1 1 300px" }}>
                  <Typography variant="subtitle1" gutterBottom>
                    On-Premise Services
                  </Typography>
                  <FormGroup>
                    {ON_PREMISE_SERVICES.map((service) => (
                      <FormControlLabel
                        key={service}
                        control={
                          <Checkbox
                            checked={
                              formData.requirements?.services?.onPremise?.includes(
                                service
                              ) || false
                            }
                            onChange={(e) =>
                              handleArrayChange(
                                "requirements.services.onPremise",
                                service,
                                e.target.checked
                              )
                            }
                          />
                        }
                        label={
                          service.charAt(0).toUpperCase() + service.slice(1)
                        }
                      />
                    ))}
                  </FormGroup>
                </GridItem>
                <GridItem sx={{ flex: "1 1 300px" }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Network Services
                  </Typography>
                  <FormGroup>
                    {NETWORK_SERVICES.map((service) => (
                      <FormControlLabel
                        key={service}
                        control={
                          <Checkbox
                            checked={
                              formData.requirements?.services?.network?.includes(
                                service
                              ) || false
                            }
                            onChange={(e) =>
                              handleArrayChange(
                                "requirements.services.network",
                                service,
                                e.target.checked
                              )
                            }
                          />
                        }
                        label={service.toUpperCase()}
                      />
                    ))}
                  </FormGroup>
                </GridItem>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* IP Scheme Section */}
          <Accordion
            expanded={expandedSection === "ip"}
            onChange={handleAccordionChange("ip")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">IP Addressing Scheme</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <GridItem sx={{ flex: "1 1 300px" }}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Private IP Range *</InputLabel>
                    <Select
                      value={
                        formData.requirements?.ipScheme?.private ||
                        "192.168.0.0/16"
                      }
                      onChange={(e) =>
                        handleNestedChange(
                          "requirements.ipScheme.private",
                          e.target.value
                        )
                      }
                      label="Private IP Range *"
                      required
                    >
                      {PRIVATE_IP_RANGES.map((range) => (
                        <MenuItem key={range} value={range}>
                          {range}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>
                <GridItem sx={{ flex: "1 1 200px" }}>
                  <TextField
                    fullWidth
                    label="Public IPs Needed"
                    type="number"
                    value={formData.requirements?.ipScheme?.publicIPs || 0}
                    onChange={(e) =>
                      handleNestedChange(
                        "requirements.ipScheme.publicIPs",
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    margin="normal"
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </GridItem>
                <GridItem sx={{ flex: "1 1 200px" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.requirements?.ipScheme?.ipv6 || false}
                        onChange={(e) =>
                          handleNestedChange(
                            "requirements.ipScheme.ipv6",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="IPv6 Support Required"
                  />
                </GridItem>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Security Requirements Section */}
          <Accordion
            expanded={expandedSection === "security"}
            onChange={handleAccordionChange("security")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Security Requirements</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <GridItem sx={{ flex: "1 1 300px" }}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Firewall Level</InputLabel>
                    <Select
                      value={
                        formData.requirements?.securityRequirements?.firewall ||
                        "basic"
                      }
                      onChange={(e) =>
                        handleNestedChange(
                          "requirements.securityRequirements.firewall",
                          e.target.value
                        )
                      }
                      label="Firewall Level"
                    >
                      {FIREWALL_LEVELS.map((level) => (
                        <MenuItem key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>
                <GridItem sx={{ flex: "1 1 300px" }}>
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            formData.requirements?.securityRequirements?.ids ||
                            false
                          }
                          onChange={(e) =>
                            handleNestedChange(
                              "requirements.securityRequirements.ids",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Intrusion Detection System (IDS)"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            formData.requirements?.securityRequirements?.ips ||
                            false
                          }
                          onChange={(e) =>
                            handleNestedChange(
                              "requirements.securityRequirements.ips",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Intrusion Prevention System (IPS)"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            formData.requirements?.securityRequirements
                              ?.contentFiltering || false
                          }
                          onChange={(e) =>
                            handleNestedChange(
                              "requirements.securityRequirements.contentFiltering",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Content Filtering"
                    />
                  </FormGroup>
                </GridItem>
                <GridItem sx={{ width: "100%" }}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Remote Access Method</InputLabel>
                    <Select
                      value={
                        formData.requirements?.securityRequirements
                          ?.remoteAccess || "none"
                      }
                      onChange={(e) =>
                        handleNestedChange(
                          "requirements.securityRequirements.remoteAccess",
                          e.target.value
                        )
                      }
                      label="Remote Access Method"
                    >
                      {REMOTE_ACCESS_METHODS.map((method) => (
                        <MenuItem key={method} value={method}>
                          {method.toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Redundancy Section */}
          <Accordion
            expanded={expandedSection === "redundancy"}
            onChange={handleAccordionChange("redundancy")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Redundancy Requirements</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        formData.requirements?.redundancy?.internet || false
                      }
                      onChange={(e) =>
                        handleNestedChange(
                          "requirements.redundancy.internet",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Redundant Internet Connections"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        formData.requirements?.redundancy?.coreSwitching ||
                        false
                      }
                      onChange={(e) =>
                        handleNestedChange(
                          "requirements.redundancy.coreSwitching",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Core Switching Redundancy"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        formData.requirements?.redundancy?.power || false
                      }
                      onChange={(e) =>
                        handleNestedChange(
                          "requirements.redundancy.power",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Power Redundancy"
                />
              </FormGroup>
            </AccordionDetails>
          </Accordion>

          {/* Budget Section */}
          <Accordion
            expanded={expandedSection === "budget"}
            onChange={handleAccordionChange("budget")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Budget Range</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl fullWidth margin="normal">
                <InputLabel>Budget Range</InputLabel>
                <Select
                  value={formData.requirements?.budgetRange || "medium"}
                  onChange={(e) =>
                    handleNestedChange(
                      "requirements.budgetRange",
                      e.target.value
                    )
                  }
                  label="Budget Range"
                >
                  {BUDGET_RANGES.map((range) => (
                    <MenuItem key={range} value={range}>
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </AccordionDetails>
          </Accordion>

          <Box mt={4}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
            >
              {submitButtonText}
            </Button>
          </Box>
        </Box>
      </CardContent>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Card>
  );
};
