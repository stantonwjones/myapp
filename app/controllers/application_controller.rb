class ApplicationController < ActionController::Base
  protect_from_forgery

  def isAdmin?
      return !!session[:isAdmin]
  end

  def require_admin
      if !isAdmin?
          redirect_to root_url
      end
  end
end
