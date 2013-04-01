class AdminController < ApplicationController
  def login
  end

  def authenticate
      if params[:password] == Rails.application.config.admin_password
          session[:isAdmin] = true;
      else
          redirect_to login
      end
  end
end
