# Component library

This repo is a set of common components that are meant to be interoperable.

Each component lives in /src/components/<Component-name> and each component has its own style file.

The component design is based around passing in children and cloning them to allow currying of components in HTML.

Each component needs to be factored into either control state or control display. The state controller is meant to be a HOC that can wrap the display controller to form a usable component while keeping the state management and display independant.

All props passed down to children need to be in an object named for the component, for example the Fold component should have toggle and isOpen under the form key like form:{toggle, isOpen}