// src/components/features/network-design/DesignView.tsx
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import { NetworkDesignUI } from "@/types/networkDesign";
import { useRouter } from "next/router";

interface DesignViewProps {
  design: NetworkDesignUI;
}

export const DesignView = ({ design }: DesignViewProps) => {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/designs/${design.id}/edit`);
  };

  // Helper to format array items for display
  const formatArrayItems = (items: string[] | undefined) => {
    if (!items || items.length === 0) return "None";
    return items.join(", ");
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">{design.designName}</Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          Edit Design
        </Button>
      </Box>

      <Typography variant="body1" paragraph>
        {design.description || "No description provided"}
      </Typography>

      <Box mt={2}>
        <Chip label={`Status: ${design.designStatus}`} />
        <Chip label={`Version: ${design.version}`} sx={{ ml: 1 }} />
        <Chip label={`Devices: ${design.deviceCount}`} sx={{ ml: 1 }} />
        <Chip label={`Reports: ${design.reportCount}`} sx={{ ml: 1 }} />
      </Box>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Design Details
        </Typography>
        <Divider />

        {/* Basic Information */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Basic Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography>
                <strong>Existing Network:</strong>{" "}
                {design.isExistingNetwork ? "Yes" : "No"}
              </Typography>
              {design.isExistingNetwork && design.existingNetworkDetails && (
                <>
                  <Typography>
                    <strong>Current Topology:</strong>{" "}
                    {design.existingNetworkDetails.currentTopology ||
                      "Not specified"}
                  </Typography>
                  <Typography>
                    <strong>Current IP Scheme:</strong>{" "}
                    {design.existingNetworkDetails.currentIPScheme ||
                      "Not specified"}
                  </Typography>
                  <Typography>
                    <strong>Current Issues:</strong>{" "}
                    {formatArrayItems(
                      design.existingNetworkDetails.currentIssues
                    )}
                  </Typography>
                </>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Network Requirements */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Network Requirements</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography>
                <strong>Total Users:</strong> {design.requirements.totalUsers}
              </Typography>
              <Typography>
                <strong>Wired Users:</strong> {design.requirements.wiredUsers}
              </Typography>
              <Typography>
                <strong>Wireless Users:</strong>{" "}
                {design.requirements.wirelessUsers}
              </Typography>
              <Typography>
                <strong>Network Segmentation:</strong>{" "}
                {design.requirements.networkSegmentation
                  ? "Enabled"
                  : "Disabled"}
              </Typography>

              {/* Bandwidth Requirements */}
              <Box mt={2}>
                <Typography variant="subtitle1">
                  <strong>Bandwidth Requirements</strong>
                </Typography>
                <Typography>
                  Upload: {design.requirements.bandwidth.upload} Mbps
                </Typography>
                <Typography>
                  Download: {design.requirements.bandwidth.download} Mbps
                </Typography>
                <Typography>
                  Symmetric:{" "}
                  {design.requirements.bandwidth.symmetric ? "Yes" : "No"}
                </Typography>
              </Box>

              {/* Network Segments */}
              {design.requirements.segments &&
                design.requirements.segments.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle1">
                      <strong>Network Segments</strong>
                    </Typography>
                    <List>
                      {design.requirements.segments.map((segment, index) => (
                        <ListItem key={index} divider>
                          <ListItemText
                            primary={segment.name}
                            secondary={
                              <>
                                <Typography component="span" display="block">
                                  Type: {segment.type}
                                </Typography>
                                <Typography component="span" display="block">
                                  Users: {segment.users}
                                </Typography>
                                <Typography component="span" display="block">
                                  Bandwidth Priority:{" "}
                                  {segment.bandwidthPriority}
                                </Typography>
                                <Typography component="span" display="block">
                                  Isolation Level: {segment.isolationLevel}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Services */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Services</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1">
                  <strong>Cloud Services</strong>
                </Typography>
                <Typography>
                  {formatArrayItems(design.requirements.services.cloud)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1">
                  <strong>On-Premise Services</strong>
                </Typography>
                <Typography>
                  {formatArrayItems(design.requirements.services.onPremise)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1">
                  <strong>Network Services</strong>
                </Typography>
                <Typography>
                  {formatArrayItems(design.requirements.services.network)}
                </Typography>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* IP Scheme */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>IP Addressing Scheme</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography>
                <strong>Private IP Range:</strong>{" "}
                {design.requirements.ipScheme.private}
              </Typography>
              <Typography>
                <strong>Public IPs Needed:</strong>{" "}
                {design.requirements.ipScheme.publicIPs}
              </Typography>
              <Typography>
                <strong>IPv6 Support:</strong>{" "}
                {design.requirements.ipScheme.ipv6 ? "Yes" : "No"}
              </Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Security Requirements */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Security Requirements</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography>
                <strong>Firewall Level:</strong>{" "}
                {design.requirements.securityRequirements.firewall}
              </Typography>
              <Typography>
                <strong>Intrusion Detection (IDS):</strong>{" "}
                {design.requirements.securityRequirements.ids ? "Yes" : "No"}
              </Typography>
              <Typography>
                <strong>Intrusion Prevention (IPS):</strong>{" "}
                {design.requirements.securityRequirements.ips ? "Yes" : "No"}
              </Typography>
              <Typography>
                <strong>Content Filtering:</strong>{" "}
                {design.requirements.securityRequirements.contentFiltering
                  ? "Yes"
                  : "No"}
              </Typography>
              <Typography>
                <strong>Remote Access Method:</strong>{" "}
                {design.requirements.securityRequirements.remoteAccess}
              </Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Redundancy Requirements */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Redundancy Requirements</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography>
                <strong>Internet Redundancy:</strong>{" "}
                {design.requirements.redundancy.internet ? "Yes" : "No"}
              </Typography>
              <Typography>
                <strong>Core Switching Redundancy:</strong>{" "}
                {design.requirements.redundancy.coreSwitching ? "Yes" : "No"}
              </Typography>
              <Typography>
                <strong>Power Redundancy:</strong>{" "}
                {design.requirements.redundancy.power ? "Yes" : "No"}
              </Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Budget */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Budget</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              <strong>Budget Range:</strong> {design.requirements.budgetRange}
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Metadata */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Metadata</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography>
                <strong>Created:</strong>{" "}
                {new Date(design.createdAt).toLocaleString()}
              </Typography>
              <Typography>
                <strong>Last Updated:</strong>{" "}
                {new Date(design.updatedAt).toLocaleString()}
              </Typography>
              {design.lastModified && (
                <Typography>
                  <strong>Last Modified:</strong>{" "}
                  {new Date(design.lastModified).toLocaleString()}
                </Typography>
              )}
              <Typography>
                <strong>Template:</strong> {design.isTemplate ? "Yes" : "No"}
              </Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};
