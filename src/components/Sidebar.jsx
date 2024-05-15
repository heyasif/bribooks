import { Box, Button, List, ListItem } from "@chakra-ui/react";

const Sidebar = ({ pages, onAddPage, onSelectPage, selectedPage }) => {
  return (
    <Box width="200px" borderRight="1px solid #ddd" p="4">
      <List spacing={3}>
        <ListItem>
          <Button onClick={() => onSelectPage(-1)}>Front Cover</Button>
        </ListItem>
        {pages.map((_, index) => (
          <ListItem key={index}>
            <Button onClick={() => onSelectPage(index)}>
              Page {index + 1}
            </Button>
          </ListItem>
        ))}
        <ListItem>
          <Button onClick={() => onSelectPage(-2)}>Back Cover</Button>
        </ListItem>
        <ListItem>
          <Button colorScheme="blue" onClick={onAddPage}>
            Add New Page
          </Button>
        </ListItem>
      </List>
    </Box>
  );
};

export default Sidebar;
