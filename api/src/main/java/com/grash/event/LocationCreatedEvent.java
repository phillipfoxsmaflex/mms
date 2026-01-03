package com.grash.event;

import com.grash.model.Location;
import lombok.Data;
import lombok.Getter;

@Getter
@Data
public class LocationCreatedEvent {
    private final Location location;
    
    public LocationCreatedEvent(Location location) {
        this.location = location;
    }
}
