## Events

- Limit the number of event handlers
- Use unbound expressions if possible
- Use <code> <aura:if></code> for conditional rendering
- Let the events bubble

- Limit the number of Application Events
- Use Component Events whenever possible

- **Application Events**
    - Coarse-grained communication
    - Follows a traditional publish-subscribe model. 
    - An application event is fired from an instance of a component. All components that provide a handler for the event are notified.
    - Has no  direct containment relationship
    - Use for high level communication between components 
    - Example: App Builder

- **Component Events**
    - Fine-grained communication
    - Fired from an instance of a component. A component event can be handled by the component that fired the event or by a component in the containment hierarchy that receives the event. 
    - So the usage is more localized to the components that need to know about them. 

