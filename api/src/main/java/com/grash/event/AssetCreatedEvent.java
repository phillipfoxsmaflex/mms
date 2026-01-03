package com.grash.event;

import com.grash.model.Asset;
import lombok.Data;
import lombok.Getter;

@Getter
@Data
public class AssetCreatedEvent {
    private final Asset asset;
    
    public AssetCreatedEvent(Asset asset) {
        this.asset = asset;
    }
}
