// src/components/features/equipment/EquipmentForm.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Box,
  Paper,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  CircularProgress,
  Chip,
  Stack,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { FileUpload } from "@/components/ui/FileUpload";
import { GridItem } from "@/components/layout/GridItem";
import AddIcon from "@mui/icons-material/Add";

interface EquipmentSpecs {
  // Common specifications
  ports?: number;
  portSpeed?: string;
  throughput?: string;
  wirelessStandard?: string;
  vlanSupport?: boolean;
  layer?: number;
  powerConsumption?: string;

  // Network-specific attributes
  managementIp?: string;
  defaultGateway?: string;
  supportsIPv6?: boolean;

  // Physical attributes
  dimensions?: string;
  weight?: string;
  rackUnitSize?: number;
  formFactor?: string;

  // Technical specs
  processor?: string;
  memory?: string;
  storage?: string;
  operatingSystem?: string;

  // Environmental specs
  operatingTemperature?: string;
  humidityRange?: string;
}

interface NetworkConfig {
  ipAddress?: string;
  subnetMask?: string;
  macAddress?: string;
  dnsServers?: string[];
  ntpServers?: string[];
}

interface Location {
  rack?: string;
  position?: number;
  room?: string;
  building?: string;
  site?: string;
}

interface Maintenance {
  lastMaintained?: Date;
  maintenanceInterval?: number;
  maintenanceNotes?: string;
}

interface Warranty {
  months?: number;
  type?: string;
}

interface EquipmentFormData {
  category: string;
  manufacturer: string;
  model: string;
  specs: EquipmentSpecs;
  priceRange: string;
  typicalUseCase: string;
  imageUrl?: string;
  datasheetUrl?: string;
  isPopular: boolean;
  releaseYear?: number;
  endOfLife?: Date | null;
  warranty?: Warranty;
  isSystemOwned?: boolean;
  isPublic?: boolean;
  isActive: boolean;
  location?: Location;
  networkConfig?: NetworkConfig;
  maintenance?: Maintenance;
}

interface EquipmentFormProps {
  onSubmit: (
    data: EquipmentFormData,
    files?: { imageFile?: File; datasheetFile?: File }
  ) => void;
  initialData?: Partial<EquipmentFormData>;
  loading?: boolean;
  isAdmin?: boolean;
}

const EquipmentForm = ({
  onSubmit,
  initialData,
  loading = false,
  isAdmin = false,
}: EquipmentFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    defaultValues: {
      category: "",
      manufacturer: "",
      model: "",
      specs: {},
      priceRange: "$$",
      typicalUseCase: "",
      isPopular: false,
      isActive: true,
      isPublic: false,
      warranty: {
        type: "limited",
      },
      ...initialData,
    },
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [datasheetFile, setDatasheetFile] = useState<File | null>(null);
  const [dnsServerInput, setDnsServerInput] = useState("");
  const [ntpServerInput, setNtpServerInput] = useState("");
  const category = watch("category");
  const networkConfig = watch("networkConfig");
  const warranty = watch("warranty");

  /*
  const handleFormSubmit = (data: EquipmentFormData) => {
    onSubmit(data, imageFile || undefined);
  };
  */

  /*
  const handleFormSubmit = (data: EquipmentFormData) => {
    onSubmit(data, {
      imageFile: imageFile || undefined,
      datasheetFile: datasheetFile || undefined,
    });
  };
  */

  const handleFormSubmit = (data: EquipmentFormData) => {
    // Validate required fields before submission
    if (!data.category || !data.manufacturer || !data.model) {
      console.error("Required fields are missing");
      return;
    }

    onSubmit(data, {
      imageFile: imageFile || undefined,
      datasheetFile: datasheetFile || undefined,
    });
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
  };

  const addDnsServer = () => {
    if (
      dnsServerInput &&
      !networkConfig?.dnsServers?.includes(dnsServerInput)
    ) {
      setValue("networkConfig.dnsServers", [
        ...(networkConfig?.dnsServers || []),
        dnsServerInput,
      ]);
      setDnsServerInput("");
    }
  };

  const removeDnsServer = (server: string) => {
    setValue(
      "networkConfig.dnsServers",
      networkConfig?.dnsServers?.filter((s) => s !== server) || []
    );
  };

  const addNtpServer = () => {
    if (
      ntpServerInput &&
      !networkConfig?.ntpServers?.includes(ntpServerInput)
    ) {
      setValue("networkConfig.ntpServers", [
        ...(networkConfig?.ntpServers || []),
        ntpServerInput,
      ]);
      setNtpServerInput("");
    }
  };

  const removeNtpServer = (server: string) => {
    setValue(
      "networkConfig.ntpServers",
      networkConfig?.ntpServers?.filter((s) => s !== server) || []
    );
  };

  const categoryFields = () => {
    const commonFields = (
      <>
        <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
          <TextField
            label="Power Consumption"
            fullWidth
            {...register("specs.powerConsumption")}
            placeholder="e.g., 50W"
            error={!!errors.specs?.powerConsumption}
            helperText={errors.specs?.powerConsumption?.message}
          />
        </GridItem>
        <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
          <FormControlLabel
            control={<Switch {...register("specs.supportsIPv6")} />}
            label="Supports IPv6"
          />
        </GridItem>
      </>
    );

    switch (category) {
      case "switch":
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Number of Ports"
                type="number"
                fullWidth
                {...register("specs.ports", { valueAsNumber: true })}
                error={!!errors.specs?.ports}
                helperText={errors.specs?.ports?.message}
              />
            </GridItem>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Port Speed"
                fullWidth
                {...register("specs.portSpeed")}
                placeholder="e.g., 1G, 10G"
                error={!!errors.specs?.portSpeed}
                helperText={errors.specs?.portSpeed?.message}
              />
            </GridItem>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Layer"
                type="number"
                fullWidth
                {...register("specs.layer", { valueAsNumber: true })}
                error={!!errors.specs?.layer}
                helperText={errors.specs?.layer?.message}
              />
            </GridItem>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <FormControlLabel
                control={<Switch {...register("specs.vlanSupport")} />}
                label="VLAN Support"
              />
            </GridItem>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Management IP"
                fullWidth
                {...register("specs.managementIp")}
                placeholder="192.168.1.1"
                error={!!errors.specs?.managementIp}
                helperText={errors.specs?.managementIp?.message}
              />
            </GridItem>
            {commonFields}
          </Box>
        );
      case "router":
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Number of Ports"
                type="number"
                fullWidth
                {...register("specs.ports", { valueAsNumber: true })}
                error={!!errors.specs?.ports}
                helperText={errors.specs?.ports?.message}
              />
            </GridItem>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Throughput"
                fullWidth
                {...register("specs.throughput")}
                placeholder="e.g., 1Gbps, 10Gbps"
                error={!!errors.specs?.throughput}
                helperText={errors.specs?.throughput?.message}
              />
            </GridItem>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Management IP"
                fullWidth
                {...register("specs.managementIp")}
                placeholder="192.168.1.1"
                error={!!errors.specs?.managementIp}
                helperText={errors.specs?.managementIp?.message}
              />
            </GridItem>
            {commonFields}
          </Box>
        );
      case "ap":
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Wireless Standard"
                fullWidth
                {...register("specs.wirelessStandard")}
                placeholder="e.g., 802.11ac, Wi-Fi 6"
                error={!!errors.specs?.wirelessStandard}
                helperText={errors.specs?.wirelessStandard?.message}
              />
            </GridItem>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Throughput"
                fullWidth
                {...register("specs.throughput")}
                placeholder="e.g., 1.7Gbps"
                error={!!errors.specs?.throughput}
                helperText={errors.specs?.throughput?.message}
              />
            </GridItem>
            {commonFields}
          </Box>
        );
      case "firewall":
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Throughput"
                fullWidth
                {...register("specs.throughput")}
                placeholder="e.g., 10Gbps"
                error={!!errors.specs?.throughput}
                helperText={errors.specs?.throughput?.message}
              />
            </GridItem>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Processor"
                fullWidth
                {...register("specs.processor")}
                placeholder="e.g., Quad-core 2.4GHz"
              />
            </GridItem>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Memory"
                fullWidth
                {...register("specs.memory")}
                placeholder="e.g., 8GB"
              />
            </GridItem>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Management IP"
                fullWidth
                {...register("specs.managementIp")}
                placeholder="192.168.1.1"
                error={!!errors.specs?.managementIp}
                helperText={errors.specs?.managementIp?.message}
              />
            </GridItem>
            {commonFields}
          </Box>
        );
      case "server":
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Processor"
                fullWidth
                {...register("specs.processor")}
                placeholder="e.g., Dual Xeon 2.8GHz"
              />
            </GridItem>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Memory"
                fullWidth
                {...register("specs.memory")}
                placeholder="e.g., 64GB"
              />
            </GridItem>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Storage"
                fullWidth
                {...register("specs.storage")}
                placeholder="e.g., 2TB SSD + 4TB HDD"
              />
            </GridItem>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Operating System"
                fullWidth
                {...register("specs.operatingSystem")}
                placeholder="e.g., Ubuntu 20.04"
              />
            </GridItem>
            <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
              <TextField
                label="Management IP"
                fullWidth
                {...register("specs.managementIp")}
                placeholder="192.168.1.1"
                error={!!errors.specs?.managementIp}
                helperText={errors.specs?.managementIp?.message}
              />
            </GridItem>
            {commonFields}
          </Box>
        );
      default:
        return null;
    }
  };

  const renderFormFactorField = () => (
    <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
      <FormControl fullWidth>
        <InputLabel>Form Factor</InputLabel>
        <Select
          label="Form Factor"
          {...register("specs.formFactor")}
          defaultValue=""
        >
          <MenuItem value="desktop">Desktop</MenuItem>
          <MenuItem value="rackmount">Rackmount</MenuItem>
          <MenuItem value="blade">Blade</MenuItem>
          <MenuItem value="modular">Modular</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </Select>
      </FormControl>
    </GridItem>
  );

  const renderWarrantyFields = () => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
      <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
        <TextField
          label="Warranty Months"
          type="number"
          fullWidth
          {...register("warranty.months", { valueAsNumber: true })}
        />
      </GridItem>
      <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
        <FormControl fullWidth>
          <InputLabel>Warranty Type</InputLabel>
          <Select
            label="Warranty Type"
            {...register("warranty.type")}
            defaultValue="limited"
          >
            <MenuItem value="limited">Limited</MenuItem>
            <MenuItem value="lifetime">Lifetime</MenuItem>
            <MenuItem value="extended">Extended</MenuItem>
          </Select>
        </FormControl>
      </GridItem>
    </Box>
  );

  const renderNetworkConfigFields = () => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
      <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
        <TextField
          label="IP Address"
          fullWidth
          {...register("networkConfig.ipAddress")}
          placeholder="192.168.1.1"
        />
      </GridItem>
      <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
        <TextField
          label="Subnet Mask"
          fullWidth
          {...register("networkConfig.subnetMask")}
          placeholder="255.255.255.0"
        />
      </GridItem>
      <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
        <TextField
          label="MAC Address"
          fullWidth
          {...register("networkConfig.macAddress")}
          placeholder="00:1A:2B:3C:4D:5E"
        />
      </GridItem>
      <GridItem sx={{ width: "100%" }}>
        <Typography variant="subtitle1" gutterBottom>
          DNS Servers
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <TextField
            value={dnsServerInput}
            onChange={(e) => setDnsServerInput(e.target.value)}
            placeholder="Add DNS server"
            fullWidth
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addDnsServer}
          >
            Add
          </Button>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {networkConfig?.dnsServers?.map((server) => (
            <Chip
              key={server}
              label={server}
              onDelete={() => removeDnsServer(server)}
            />
          ))}
        </Stack>
      </GridItem>
      <GridItem sx={{ width: "100%" }}>
        <Typography variant="subtitle1" gutterBottom>
          NTP Servers
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <TextField
            value={ntpServerInput}
            onChange={(e) => setNtpServerInput(e.target.value)}
            placeholder="Add NTP server"
            fullWidth
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addNtpServer}
          >
            Add
          </Button>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {networkConfig?.ntpServers?.map((server) => (
            <Chip
              key={server}
              label={server}
              onDelete={() => removeNtpServer(server)}
            />
          ))}
        </Stack>
      </GridItem>
    </Box>
  );

  const renderLocationFields = () => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
      <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
        <TextField
          label="Rack"
          fullWidth
          {...register("location.rack")}
          placeholder="e.g., Rack A"
        />
      </GridItem>
      <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
        <TextField
          label="Position (U)"
          type="number"
          fullWidth
          {...register("location.position", { valueAsNumber: true })}
        />
      </GridItem>
      <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
        <TextField
          label="Room"
          fullWidth
          {...register("location.room")}
          placeholder="e.g., Server Room 1"
        />
      </GridItem>
      <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
        <TextField
          label="Building"
          fullWidth
          {...register("location.building")}
          placeholder="e.g., Main Building"
        />
      </GridItem>
      <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
        <TextField
          label="Site"
          fullWidth
          {...register("location.site")}
          placeholder="e.g., Headquarters"
        />
      </GridItem>
    </Box>
  );

  const renderMaintenanceFields = () => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
      <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
        <DatePicker
          label="Last Maintained"
          {...register("maintenance.lastMaintained")}
          onChange={(date: Date | null) => {
            setValue("maintenance.lastMaintained", date || undefined);
          }}
          slotProps={{
            textField: {
              fullWidth: true,
            },
          }}
        />
      </GridItem>
      <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
        <TextField
          label="Maintenance Interval (days)"
          type="number"
          fullWidth
          {...register("maintenance.maintenanceInterval", {
            valueAsNumber: true,
          })}
        />
      </GridItem>
      <GridItem sx={{ width: "100%" }}>
        <TextField
          label="Maintenance Notes"
          multiline
          rows={3}
          fullWidth
          {...register("maintenance.maintenanceNotes")}
        />
      </GridItem>
    </Box>
  );

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <FormControl fullWidth error={!!errors.category}>
              <InputLabel id="category-label">Category *</InputLabel>
              <Select
                labelId="category-label"
                label="Category *"
                {...register("category", {
                  required: "Category is required",
                  validate: (value) =>
                    value !== "" || "Please select a category",
                })}
                value={watch("category") || ""} // Ensure value is never undefined
              >
                <MenuItem value="">Select a category</MenuItem>
                <MenuItem value="switch">Switch</MenuItem>
                <MenuItem value="router">Router</MenuItem>
                <MenuItem value="firewall">Firewall</MenuItem>
                <MenuItem value="ap">Access Point</MenuItem>
                <MenuItem value="server">Server</MenuItem>
              </Select>
              {errors.category && (
                <FormHelperText>{errors.category.message}</FormHelperText>
              )}
            </FormControl>
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <TextField
              label="Manufacturer *"
              fullWidth
              {...register("manufacturer", {
                required: "Manufacturer is required",
                minLength: {
                  value: 2,
                  message: "Manufacturer must be at least 2 characters",
                },
              })}
              error={!!errors.manufacturer}
              helperText={errors.manufacturer?.message}
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <TextField
              label="Model *"
              fullWidth
              {...register("model", {
                required: "Model is required",
                minLength: {
                  value: 2,
                  message: "Model must be at least 2 characters",
                },
              })}
              error={!!errors.model}
              helperText={errors.model?.message}
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <FormControl fullWidth>
              <InputLabel id="price-range-label">Price Range</InputLabel>
              <Select
                labelId="price-range-label"
                label="Price Range"
                {...register("priceRange")}
                defaultValue="$$"
              >
                <MenuItem value="">Select price range</MenuItem>
                <MenuItem value="$">$ - Budget</MenuItem>
                <MenuItem value="$$">$$ - Mid-range</MenuItem>
                <MenuItem value="$$$">$$$ - Premium</MenuItem>
                <MenuItem value="$$$$">$$$$ - Enterprise</MenuItem>
              </Select>
            </FormControl>
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <TextField
              label="Release Year"
              type="number"
              fullWidth
              {...register("releaseYear", {
                min: { value: 2000, message: "Must be after 2000" },
                max: {
                  value: new Date().getFullYear(),
                  message: "Cannot be in the future",
                },
              })}
              error={!!errors.releaseYear}
              helperText={errors.releaseYear?.message}
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <DatePicker
              label="End of Life Date"
              value={
                watch("endOfLife") instanceof Date ? watch("endOfLife") : null
              }
              onChange={(date) => setValue("endOfLife", date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </GridItem>
          <GridItem sx={{ width: "100%" }}>
            <TextField
              label="Typical Use Case"
              multiline
              rows={3}
              fullWidth
              {...register("typicalUseCase")}
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <TextField
              label="Datasheet URL"
              fullWidth
              {...register("datasheetUrl")}
              placeholder="https://example.com/datasheet.pdf"
            />
          </GridItem>
          {isAdmin && (
            <>
              <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
                <FormControlLabel
                  control={<Switch {...register("isSystemOwned")} />}
                  label="System Owned"
                />
              </GridItem>
              <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
                <FormControlLabel
                  control={<Switch {...register("isPublic")} />}
                  label="Publicly Visible"
                />
              </GridItem>
            </>
          )}
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <FormControlLabel
              control={<Switch {...register("isPopular")} />}
              label="Popular Equipment"
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 24px)" } }}>
            <FormControlLabel
              control={<Switch defaultChecked {...register("isActive")} />}
              label="Active"
            />
          </GridItem>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Specifications
        </Typography>
        <Divider sx={{ mb: 3 }} />
        {category ? (
          <>
            {categoryFields()}
            {renderFormFactorField()}
          </>
        ) : (
          <Typography color="text.secondary">
            Select a category to view specific fields
          </Typography>
        )}
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Physical Attributes
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
            <TextField
              label="Dimensions (W x H x D)"
              fullWidth
              {...register("specs.dimensions")}
              placeholder="e.g., 1.75 x 19 x 10 in"
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
            <TextField
              label="Weight"
              fullWidth
              {...register("specs.weight")}
              placeholder="e.g., 5.5 lbs"
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
            <TextField
              label="Rack Unit Size (U)"
              type="number"
              fullWidth
              {...register("specs.rackUnitSize", { valueAsNumber: true })}
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
            <TextField
              label="Operating Temperature"
              fullWidth
              {...register("specs.operatingTemperature")}
              placeholder="e.g., 0°C to 40°C"
            />
          </GridItem>
          <GridItem sx={{ width: { xs: "100%", sm: "calc(50% - 16px)" } }}>
            <TextField
              label="Humidity Range"
              fullWidth
              {...register("specs.humidityRange")}
              placeholder="e.g., 10% to 90%"
            />
          </GridItem>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Warranty Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        {renderWarrantyFields()}
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Location Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        {renderLocationFields()}
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Network Configuration
        </Typography>
        <Divider sx={{ mb: 3 }} />
        {renderNetworkConfigFields()}
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Maintenance Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        {renderMaintenanceFields()}
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Equipment Image
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <FileUpload accept="image/*" onChange={handleImageChange} />
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Datasheet (PDF)
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <FileUpload
          accept="application/pdf"
          onChange={setDatasheetFile}
          //maxSize={10 * 1024 * 1024} // 10MB
        />
      </Paper>

      <Box display="flex" justifyContent="flex-end" mt={4}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Save Equipment"}
        </Button>
      </Box>
    </Box>
  );
};

export default EquipmentForm;
export type { EquipmentFormData };
