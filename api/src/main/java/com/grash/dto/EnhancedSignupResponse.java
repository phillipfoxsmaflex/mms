
package com.grash.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnhancedSignupResponse<T> {
    private boolean success;
    private String message;
    private String token;
    private boolean requiresEmailVerification;
    private T user;

    public EnhancedSignupResponse(boolean success, String message, String token, boolean requiresEmailVerification) {
        this.success = success;
        this.message = message;
        this.token = token;
        this.requiresEmailVerification = requiresEmailVerification;
        this.user = null;
    }
}
