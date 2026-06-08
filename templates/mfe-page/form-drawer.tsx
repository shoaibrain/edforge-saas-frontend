import { Button, Drawer, DrawerFooter, Field, Input, Stack } from '@edforge/ui'

export interface __PAGE_COMPONENT__Props {
  open: boolean
  onClose: () => void
}

export function __PAGE_COMPONENT__({ open, onClose }: __PAGE_COMPONENT__Props) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="__PAGE_TITLE__"
      description="Use drawers for focused create/edit workflows."
    >
      <Stack>
        <Field label="Name" required optionalText={null}>
          <Input placeholder="Enter a name" />
        </Field>
      </Stack>

      <DrawerFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button">Save</Button>
      </DrawerFooter>
    </Drawer>
  )
}
